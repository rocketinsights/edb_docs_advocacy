from io import StringIO
from pathlib import Path

from ...generate_pdf import TocItem, combine_mdx

base = Path(__file__).parent


def test_combine_mdx():
    src = base / "src"
    files = [TocItem(p, [i]) for i, p in enumerate((src).glob("**/*.mdx"), start=1)]
    output = StringIO()
    resource_search_paths = combine_mdx(files, output)
    assert output.getvalue() == (base / "expected.mdx").read_text()
    assert resource_search_paths == {src}
