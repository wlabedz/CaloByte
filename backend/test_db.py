import pytest
from sqlalchemy import text

from conftest import assert_local_database_url


def test_db_session_works(db_session):
    assert db_session.execute(text("select 1")).scalar() == 1


def test_conftest_refuses_remote_db():
    with pytest.raises(RuntimeError):
        assert_local_database_url("postgresql://u:p@ep-x.neon.tech/db")
    assert_local_database_url("postgresql://u:p@localhost:5432/x")
    assert_local_database_url("postgresql://u:p@postgres:5432/x")
