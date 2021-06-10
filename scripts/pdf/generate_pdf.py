#!/usr/bin/env python3
import re
from argparse import ArgumentParser, ArgumentTypeError
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from subprocess import run

BASE_DIR = Path(__file__).resolve().parent

ANSI_STOP = "\033[0m"
ANSI_BLUE = "\033[34m"
ANSI_GREEN = "\033[32m"
ANSI_YELLOW = "\033[33m"
ANSI_RED = "\033[31m"


def main(args):
    doc_path = args.doc_path
    product = doc_path.parts[2]
    version = doc_path.parts[3]

    _file_prefix = f"{product}_v{version}_documentation"

    mdx_file = doc_path / f"{_file_prefix}.mdx"
    html_file = doc_path / f"{_file_prefix}.html"
    cover_file = doc_path / f"{_file_prefix}_cover.html"
    pdf_file = doc_path / f"{_file_prefix}.pdf"

    print(f"{ANSI_BLUE}building {pdf_file}{ANSI_STOP}")

    mdx_file.unlink(missing_ok=True)

    # Get the list of all files in directory tree at given path
    files = list_files(doc_path, "")
    if len(files) == 0:
        raise Exception(f"no files in {doc_path}")
    files.pop(0)  # remove base product index page, which are empty

    for elem in files:
        g = open(elem.filename, "r")
        for line in g.readlines():
            if "title: " in line:
                elem.title = line[7:].replace('"', "").replace("\n", "")
            pattern = re.compile('div id="(.*?)" class="registered_link"')

            tag = pattern.search(line)
            if tag and len(elem.anchor) == 0:
                elem.anchor = tag.group(1)

    resource_search_paths = {doc_path}

    # Print the files
    with open(mdx_file, "w") as fp:
        for elem in files:
            g = open(elem.filename, "r")
            resource_search_paths.add(elem.filename.parent)

            front_matter_count = 2
            for line in g.readlines():
                new_line = line

                if line[0:2] == "# ":
                    new_line = "##" + line
                if line[0:3] == "## ":
                    new_line = "#" + line
                if "toctree" in line:
                    front_matter_count = 3
                if front_matter_count == 0:
                    fp.write(new_line)
                if "title: " in line:
                    new_line = (
                        re.sub(r"\.0", "", elem.chapter)
                        + ("&nbsp;" * 10)
                        + strip_quotes(line[7:])
                        + "\n"
                    )
                    fp.write(new_line)
                if "---" in line and front_matter_count > 0:
                    front_matter_count -= 1
                    fp.write(new_line)
            fp.write("\n")

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
        with open(BASE_DIR / "cover.html") as source, open(cover_file, "w") as output:
            data = source.read()
            data = data.replace("[PRODUCT]", title)
            data = data.replace("[VERSION]", version)
            output.write(data)

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


def put_index_first(path):
    filename = str(path)
    return filename.replace("index.mdx", "00_index.mdx")


def filter_path(path):
    if path.is_dir() and not path.match("*images*"):
        return True
    elif path.suffix in [".mdx", ".md"]:
        return True
    else:
        return False


def get_title(doc_path):
    index_path = doc_path / "index.mdx"
    if index_path.exists():
        index_file = open(index_path, "r")
        for line in index_file.readlines():
            if "title: " in line:
                return strip_quotes(line.replace("title: ", ""))
    return None


def strip_quotes(str):
    return str.strip().strip("'").strip('"')


def list_files(doc_path, parent_chapter):
    # create a list of file and sub directories names in the given directory
    files = list(filter(filter_path, doc_path.iterdir()))
    files.sort(key=put_index_first)
    all_files = list()
    chapter = 0

    # Iterate over all the entries
    for entry in files:
        # If entry is a directory then get the list of files in this directory
        if entry.is_dir():
            all_files += list_files(entry, f"{parent_chapter}{str(chapter)}.")
        else:
            all_files.append(TocItem(entry, parent_chapter + str(chapter)))

        chapter += 1
    return all_files


@dataclass
class TocItem:
    filename: Path
    chapter: str
    title: str = ""
    anchor: str = ""


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
