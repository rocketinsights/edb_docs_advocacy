#!/usr/bin/env python3
import os
from argparse import ArgumentParser, ArgumentTypeError
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from subprocess import run
from typing import List

BASE_DIR = Path(__file__).resolve().parent

ANSI_BLUE = "\033[34m"
ANSI_STOP = "\033[0m"
ANSI_YELLOW = "\033[33m"


def main(args):
    doc_path, product, version, mdx_file, html_file, cover_file, pdf_file = setup(args)

    files = list_files(doc_path)
    if len(files) == 0:
        print(f"{ANSI_YELLOW}skipping {pdf_file}{ANSI_STOP}")
        return

    print(f"{ANSI_BLUE}building {pdf_file}{ANSI_STOP}")
    with open(mdx_file, "w") as output:
        resource_search_paths = {doc_path, *combine_mdx(files, output)}

    # TODO: Pick up refactoring from this point
    title = get_title(doc_path) or product

    print("generating docs html")
    output = run(
        [
            "pandoc",
            mdx_file,
            "--from=gfm",
            "--self-contained",
            "--highlight-style=tango",
            f"--css={BASE_DIR / 'pdf-styles.css'}",
            f"--resource-path={':'.join((str(p) for p in resource_search_paths))}",
            f"--output={html_file}",
        ]
    )
    output.check_returncode()

    if not html_file.exists():
        mdx_file.unlink()
        raise Exception(f"\033[91m html file failed to generate for {mdx_file} \033[0m")

    if args.generate_html_only:
        run(["open", html_file])
    else:
        print("generating cover page")
        data = (BASE_DIR / "cover.html").read_text()
        data = data.replace("[PRODUCT]", title)
        data = data.replace("[VERSION]", version)
        cover_file.write_text(data)

        header_footer_common = [
            "--header-font-name",
            "Signika",
            "--header-font-size",
            "8",
            "--header-spacing",
            "7",
            "--footer-font-name",
            "Signika",
            "--footer-font-size",
            "8",
            "--footer-spacing",
            "7",
            "--footer-left",
            f"Copyright © 2009 - {datetime.now().year} EnterpriseDB Corporation. "
            "All rights reserved.",
        ]

        header_footer_options = [
            "--header-right",
            "[doctitle]",
            "--footer-right",
            "[page]",
        ]

        print("converting html to pdf")
        output = run(
            [
                "wkhtmltopdf",
                "--log-level",
                "error",
                "--title",
                title,
                "--margin-top",
                "15mm",
                "--margin-bottom",
                "15mm",
                *header_footer_common,
                cover_file,
                "--footer-right",
                f"Built at {datetime.utcnow().replace(microsecond=0).isoformat()}",
                "toc",
                "--xsl-style-sheet",
                "scripts/pdf/toc-style.xsl",
                *header_footer_options,
                html_file,
                *header_footer_options,
                pdf_file,
            ]
        )
        output.check_returncode()

    if args.open_pdf:
        run(["open", pdf_file])

    mdx_file.unlink()
    if not args.generate_html_only:
        html_file.unlink()
        cover_file.unlink()


def setup(args):
    doc_path = args.doc_path
    product = doc_path.parts[2]
    version = doc_path.parts[3]

    _file_prefix = f"{product}_v{version}_documentation"

    mdx_file = doc_path / f"{_file_prefix}.mdx"
    html_file = doc_path / f"{_file_prefix}.html"
    cover_file = doc_path / f"{_file_prefix}_cover.html"
    pdf_file = doc_path / f"{_file_prefix}.pdf"

    for f in [mdx_file, html_file, cover_file]:
        f.unlink(missing_ok=True)

    return doc_path, product, version, mdx_file, html_file, cover_file, pdf_file


def list_files(doc_path, chapter=None, is_root_dir=True):
    chapter = [1] if chapter is None else chapter
    all_files = []
    directory_contents = sorted(
        filter(filter_path, doc_path.iterdir()), key=put_index_first
    )

    for i, entry in enumerate(directory_contents):
        chapter = (
            advance_chapter(
                chapter[:-1] if is_root_dir and len(chapter) > 1 else chapter
            )
            if i != 0
            else [*chapter, 0]
            if entry.is_file()
            else chapter
        )

        if entry.is_file():
            all_files.append(TocItem(filename=entry, chapter=chapter))
        else:
            all_files += list_files(entry, chapter, is_root_dir=False)

    return all_files


def combine_mdx(files, output):
    resource_search_paths = set()

    for item in files:
        resource_search_paths.add(item.filename.parent)
        front_matter, content = parse_mdx(item.filename)
        write_front_matter(front_matter, item.chapter, output)
        write_content(content, output)

    return resource_search_paths


def write_front_matter(front_matter, chapter, output):
    title_marker = "title: "

    print("---", file=output)

    for line in [
        line for line in front_matter.split(os.linesep) if title_marker in line
    ]:
        title = strip_quotes(line.replace(title_marker, ""))
        print(f'{chapter}{"&nbsp;" * 10}{title}', file=output)

    print("---", file=output)
    output.write(os.linesep)


def write_content(content, output):
    lines = []
    for line in content.split(os.linesep):
        if "toctree" in line:
            break
        line = f"#{line}" if (line.startswith("# ") or line.startswith("## ")) else line
        lines.append(line + os.linesep)
    output.writelines(lines)
    output.write(os.linesep)


def advance_chapter(chapter):
    return [*chapter[:-1], chapter[-1] + 1]


def filter_path(path):
    if path.is_dir() and not path.match("*images*"):
        return True
    elif path.suffix in [".mdx", ".md"]:
        _, content = parse_mdx(path)
        no_content = content == "" or (
            len(content.split(os.linesep)) == 1 and "StubCards" in content
        )
        return not no_content
    else:
        return False


def parse_mdx(mdx_file):
    front_matter, _, content = mdx_file.read_text().partition("---")[2].partition("---")
    return front_matter.strip(), content.strip()


def put_index_first(path):
    filename = str(path)
    return filename.replace("index.mdx", "00_index.mdx")


def get_title(doc_path):
    index_path = doc_path / "index.mdx"
    if index_path.exists():
        with open(index_path) as index_file:
            for line in (line for line in index_file if "title: " in line):
                return strip_quotes(line.replace("title: ", ""))
    return None


def strip_quotes(str):
    return str.strip().strip("'").strip('"')


@dataclass
class TocItem:
    filename: Path
    chapter: List[int]

    def __post_init__(self):
        self.chapter = ".".join((str(c) for c in self.chapter if c > 0))


def cli():
    parser = ArgumentParser(
        description=(
            "generate a PDF based on documentation files from a product directory"
        )
    )
    parser.add_argument(
        "doc_path",
        metavar="doc-path",
        type=path_type,
        help="directory path for a specific product's documentation",
    )
    group = parser.add_mutually_exclusive_group()
    group.add_argument(
        "--html",
        dest="generate_html_only",
        action="store_true",
        help="generate the intermediate HTML instead of PDF",
    )
    group.add_argument(
        "--open",
        dest="open_pdf",
        action="store_true",
        help="open the PDF after generation",
    )
    return parser.parse_args()


def path_type(arg):
    p = Path(arg)
    if not (p.exists() and p.is_dir()):
        raise ArgumentTypeError(f'"{arg}" is not a valid directory')
    return p


if __name__ == "__main__":
    main(cli())
