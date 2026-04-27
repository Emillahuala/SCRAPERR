import scraper


def test_package_importable() -> None:
    assert scraper.__version__ == "0.1.0"
