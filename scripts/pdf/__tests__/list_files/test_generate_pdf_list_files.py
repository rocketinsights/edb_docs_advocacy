import importlib
from collections import namedtuple
from pathlib import Path
from tempfile import mkdtemp

import pytest

from ...generate_pdf import list_files

base = Path(__file__).parent
base_package = ".".join(__name__.split(".")[:-1])
Scenario = namedtuple("Scenario", ("path", "expected_module"))


def test_empty():
    tmp_path = Path(mkdtemp())
    assert list_files(tmp_path) == []
    tmp_path.rmdir()


@pytest.fixture(params=(base / "test_cases").iterdir())
def test_case(request):
    expected_module = ".".join(
        ["", *str(request.param.relative_to(base)).split("/"), "expected"]
    )
    return Scenario(request.param, expected_module)


def test_list_files(test_case):
    expected = importlib.import_module(test_case.expected_module, base_package)
    assert list_files(test_case.path) == expected.expected
