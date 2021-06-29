from pathlib import Path

from .....generate_pdf import TocItem

expected = [
    TocItem(filename=Path(__file__).parent / "1/index.mdx", chapter=[1]),
    TocItem(filename=Path(__file__).parent / "1/1.1.mdx", chapter=[1, 1]),
    TocItem(filename=Path(__file__).parent / "1/1.2/index.mdx", chapter=[1, 2]),
    TocItem(filename=Path(__file__).parent / "1/1.2/1.2.1.mdx", chapter=[1, 2, 1]),
    TocItem(filename=Path(__file__).parent / "2/index.mdx", chapter=[2]),
    TocItem(filename=Path(__file__).parent / "2/2.1.mdx", chapter=[2, 1]),
    TocItem(filename=Path(__file__).parent / "3.mdx", chapter=[3]),
]
