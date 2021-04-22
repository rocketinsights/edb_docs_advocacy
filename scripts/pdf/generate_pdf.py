#!/usr/bin/env python3
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from subprocess import run

BASE_DIR = Path(__file__).resolve().parent

ANSI_STOP = "\033[0m"
ANSI_BLUE = "\033[34m"
ANSI_GREEN = "\033[32m"
ANSI_YELLOW = "\033[33m"
ANSI_RED = "\033[31m"


# magic snippet for inline repl
# import code; code.interact(local=dict(globals(), **locals()))


class ToCItem:
    def __init__(self, filename, chapter):
        self.filename = filename
        self.chapter = chapter
        self.title = ""
        self.anchor = ""


def putIndexFirst(e):
    return e.filename.replace("index.mdx", "00_index.mdx")


def putIndexFirst2(e):
    return e.replace("index.mdx", "00_index.mdx")


def getFilename(file):
    return file.filename


def filterList(filename):
    if ".png" in filename or "images" in filename or ".DS_Store" in filename:
        return False
    else:
        return True


def getTitle(dirName):
    indexPath = dirName + "/index.mdx"
    if os.path.exists(indexPath):
        indexFile = open(indexPath, "r")
        for line in indexFile.readlines():
            if "title: " in line:
                return stripQuotes(line.replace("title: ", ""))
    return None


def stripQuotes(str):
    return str.strip().strip("'").strip('"')


def getListOfFiles(dirName, parentChapter):
    # create a list of file and sub directories
    # names in the given directory
    listOfFiles = list(filter(filterList, os.listdir(dirName)))
    listOfFiles.sort(key=putIndexFirst2)
    allFiles = list()
    chapter = 0

    # Iterate over all the entries
    for entry in listOfFiles:
        # Create full path
        fullPath = os.path.join(dirName, entry)
        # If entry is a directory then get the list of files in this directory
        if os.path.isdir(fullPath):
            allFiles = allFiles + getListOfFiles(
                fullPath, parentChapter + str(chapter) + "."
            )
        elif ".mdx" in entry or ".md" in entry:
            allFiles.append(ToCItem(fullPath, parentChapter + str(chapter)))

        chapter += 1
    return allFiles


def main():
    dirName = ""
    try:
        dirName = sys.argv[1]
        dirName = re.sub(r"\/$", "", dirName)
    except BaseException:
        print("directory not passed in")
        print("if running from yarn use `yarn build-pdf directory/path/here`")
        sys.exit(1)

    openPdf = False
    html = False
    try:
        html = sys.argv[2] == "--html"
        openPdf = sys.argv[2] == "--open"
    except BaseException:
        pass

    splitDirName = dirName.split("/")
    product = splitDirName[2]
    version = splitDirName[3]

    fullProductPdf = True
    guide = None
    if len(splitDirName) > 4:
        fullProductPdf = False
        guide = splitDirName[4]

    _file_prefix = f"{dirName}/{product}_v{version}"
    _doc_prefix = f"{_file_prefix}_documentation"
    mdxFilePath = f"{_doc_prefix}.mdx"
    htmlFilePath = f"{_doc_prefix}.html"
    coverFilePath = f"{_doc_prefix}_cover.html"
    pdfFilePath = f"{_file_prefix}" "_{}documentation.pdf".format(
        guide + "_" if guide else ""
    )

    print(f"{ANSI_BLUE}building {pdfFilePath}{ANSI_STOP}")

    if not os.path.exists(dirName):
        raise Exception("directory does not exist")

    if os.path.exists(mdxFilePath):
        os.remove(mdxFilePath)

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

    resourceSearchPaths = {dirName}

    # Print the files
    with open(mdxFilePath, "w") as fp:
        for elem in listOfFiles:
            g = open(elem.filename, "r")

            baseImagePath = os.path.split(elem.filename)[0]
            resourceSearchPaths.add(baseImagePath)

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
            f"--resource-path={':'.join(resourceSearchPaths)}",
            f"--output={htmlFilePath}",
        ]
    )
    output.check_returncode()

    if not os.path.exists(htmlFilePath):
        os.remove(mdxFilePath)
        raise Exception(
            f"\033[91m html file failed to generate for {mdxFilePath} \033[0m"
        )

    if html:
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

    if openPdf:
        run(["open", pdfFilePath])

    os.remove(mdxFilePath)
    if not html:
        os.remove(htmlFilePath)
        os.remove(coverFilePath)


if __name__ == "__main__":
    main()
