from pathlib import Path

from ....generate_pdf import TocItem

expected = [TocItem(filename=Path(__file__).parent / "index.mdx", chapter=[1])]
