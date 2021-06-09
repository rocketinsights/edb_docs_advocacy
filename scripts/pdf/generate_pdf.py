#!/usr/bin/env python3
import argparse
import re
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
    dirName = args.doc_path
    product = dirName.parts[2]
    version = dirName.parts[3]

    fullProductPdf = True
    guide = None
    # GS 2021-06-04: I don't think this if condition is possible
    if len(dirName.parts) > 4:
        fullProductPdf = False
        guide = dirName.parts[4]

    _file_prefix = f"{dirName}/{product}_v{version}"
    _doc_prefix = f"{_file_prefix}_documentation"
    mdxFilePath = Path(f"{_doc_prefix}.mdx")
    htmlFilePath = Path(f"{_doc_prefix}.html")
    coverFilePath = Path(f"{_doc_prefix}_cover.html")
    pdfFilePath = Path(
        f"{_file_prefix}" "_{}documentation.pdf".format(guide + "_" if guide else "")
    )

    print(f"{ANSI_BLUE}building {pdfFilePath}{ANSI_STOP}")

    if not dirName.exists():
        raise Exception("directory does not exist")

    mdxFilePath.unlink(missing_ok=True)

    # Get the list of all files in directory tree at given path
    listOfFiles = getListOfFiles(dirName, "")
    if len(listOfFiles) == 0:
        raise Exception(f"no files in {dirName}")
    if fullProductPdf:
        listOfFiles.pop(0)  # remove base product index page, which are empty

    for elem in listOfFiles:
        g = open(elem.filename, "r")
        for line in g.readlines():
            if "title: " in line:
                elem.title = line[7:].replace('"', "").replace("\n", "")
            pattern = re.compile('div id="(.*?)" class="registered_link"')

            tag = pattern.search(line)
            if tag and len(elem.anchor) == 0:
                elem.anchor = tag.group(1)

    resourceSearchPaths = {str(dirName)}

    # Print the files
    with open(mdxFilePath, "w") as fp:
        for elem in listOfFiles:
            g = open(elem.filename, "r")
            resourceSearchPaths.add(elem.filename.parent)

            frontmatterCount = 2
            for line in g.readlines():
                newLine = line

                if line[0:2] == "# ":
                    newLine = "##" + line
                if line[0:3] == "## ":
                    newLine = "#" + line
                if "toctree" in line:
                    frontmatterCount = 3
                if frontmatterCount == 0:
                    fp.write(newLine)
                if "title: " in line:
                    newLine = (
                        re.sub(r"\.0", "", elem.chapter)
                        + ("&nbsp;" * 10)
                        + stripQuotes(line[7:])
                        + "\n"
                    )
                    fp.write(newLine)
                if "---" in line and frontmatterCount > 0:
                    frontmatterCount -= 1
                    fp.write(newLine)
            fp.write("\n")

    title = getTitle(dirName) or product

    print("generating docs html")
    output = run(
        [
            "pandoc",
            mdxFilePath,
            "--from=gfm",
            "--self-contained",
            "--highlight-style=tango",
            f"--css={BASE_DIR / 'pdf-styles.css'}",
            f"--resource-path={':'.join((str(p) for p in resourceSearchPaths))}",
            f"--output={htmlFilePath}",
        ]
    )
    output.check_returncode()

    if not htmlFilePath.exists():
        mdxFilePath.unlink()
        raise Exception(
            f"\033[91m html file failed to generate for {mdxFilePath} \033[0m"
        )

    if args.generate_html_only:
        run(["open", htmlFilePath])
    else:
        print("generating cover page")
        with open(BASE_DIR / "cover.html") as source, open(
            coverFilePath, "w"
        ) as output:
            data = source.read()
            data = data.replace("[PRODUCT]", title)
            data = data.replace("[VERSION]", version)
            output.write(data)

        headerFooterCommon = [
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

        headerFooterOptions = [
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
                *headerFooterCommon,
                coverFilePath,
                "--footer-right",
                f"Built at {datetime.utcnow().replace(microsecond=0).isoformat()}",
                "toc",
                "--xsl-style-sheet",
                "scripts/pdf/toc-style.xsl",
                *headerFooterOptions,
                htmlFilePath,
                *headerFooterOptions,
                pdfFilePath,
            ]
        )
        output.check_returncode()

    if args.open_pdf:
        run(["open", pdfFilePath])

    mdxFilePath.unlink()
    if not args.generate_html_only:
        htmlFilePath.unlink()
        coverFilePath.unlink()


def putIndexFirst(path):
    filename = str(path)
    return filename.replace("index.mdx", "00_index.mdx")


def filterList(path):
    if path.is_dir() and not path.match("*images*"):
        return True
    elif path.suffix in [".mdx", ".md"]:
        return True
    else:
        return False


def getTitle(dirName):
    indexPath = dirName / "index.mdx"
    if indexPath.exists():
        indexFile = open(indexPath, "r")
        for line in indexFile.readlines():
            if "title: " in line:
                return stripQuotes(line.replace("title: ", ""))
    return None


def stripQuotes(str):
    return str.strip().strip("'").strip('"')


def getListOfFiles(dirName, parentChapter):
    # create a list of file and sub directories names in the given directory
    listOfFiles = list(filter(filterList, dirName.iterdir()))
    listOfFiles.sort(key=putIndexFirst)
    allFiles = list()
    chapter = 0

    # Iterate over all the entries
    for entry in listOfFiles:
        # If entry is a directory then get the list of files in this directory
        if entry.is_dir():
            allFiles = allFiles + getListOfFiles(
                entry, f"{parentChapter}{str(chapter)}."
            )
        else:
            allFiles.append(ToCItem(entry, parentChapter + str(chapter)))

        chapter += 1
    return allFiles


@dataclass
class ToCItem:
    filename: Path
    chapter: str
    title: str = ""
    anchor: str = ""


def cli():
    parser = argparse.ArgumentParser(
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
        raise argparse.ArgumentTypeError(f'"{arg}" is not a valid directory')
    return p


if __name__ == "__main__":
    main(cli())
