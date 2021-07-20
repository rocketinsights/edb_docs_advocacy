#!/usr/bin/env python3
import argparse
import multiprocessing
import shlex
import subprocess
from itertools import zip_longest
from pathlib import Path

import pdftotext


def main(args):
    pdfs = sorted(
        args.dir1.glob("**/*.pdf"), key=lambda x: x.stat().st_size, reverse=True
    )
    args.removed_pdfs = args.output_dir / "00_removed_pdfs.txt"
    args.removed_pdfs.unlink(missing_ok=True)
    with multiprocessing.Pool(int(multiprocessing.cpu_count() * 2 / 3)) as pool:
        pool.starmap(process_pdf, zip_longest(pdfs, [], fillvalue=args), chunksize=1)

    if args.removed_pdfs.exists():
        print(f'See removed PDFs in "{args.removed_pdfs}"')


def process_pdf(pdf1, args):
    pdf2 = args.dir2 / pdf1.name

    if not pdf2.is_file():
        print(f"☠️  {pdf1.name}")
        with open(args.removed_pdfs, "a") as of:
            print(pdf1.name, file=of)
        return

    print(f"👷‍♀️ {pdf1.name}")
    if args.should_output_text:
        generate_pdf_text(pdf1, pdf2, args)
    else:
        diff_pdfs(pdf1, pdf2, args)
    print(f"✅ {pdf1.name}")


def generate_pdf_text(pdf1, pdf2, args):
    for i, pdf in enumerate([pdf1, pdf2], start=1):
        output = args.output_dir / f"dir{i}" / f"{pdf.stem}.txt"
        with open(pdf, "rb") as f:
            content = pdftotext.PDF(f)
        output.parent.mkdir(exist_ok=True)
        with open(output, "w+") as of:
            of.write("\n".join(content))


def diff_pdfs(pdf1, pdf2, args):
    diff = args.output_dir / pdf1.name
    cmd = shlex.split(f"diff-pdf -s -m -g --output-diff={diff} {pdf1} {pdf2}")
    subprocess.run(cmd, capture_output=True)


def cli():
    parser = argparse.ArgumentParser(description="compare PDFs from two directories")
    parser.add_argument("dir1", type=path_type, help="first directory of PDFs")
    parser.add_argument("dir2", type=path_type, help="second directory of PDFs")
    parser.add_argument(
        "output_dir", type=output_type, help="directory to store visual PDF diffs"
    )
    parser.add_argument(
        "--text",
        dest="should_output_text",
        action="store_true",
        help=(
            "generate raw text (instead of visual diffs) "
            "from source PDFs for manual diff-ing"
        ),
    )
    return parser.parse_args()


def path_type(arg):
    p = Path(arg)
    if not p.is_dir():
        raise argparse.ArgumentTypeError(f'"{arg}" is not a valid directory')
    return p


def output_type(arg):
    p = Path(arg)
    p.mkdir(parents=True, exist_ok=True)
    return p


if __name__ == "__main__":
    main(cli())
