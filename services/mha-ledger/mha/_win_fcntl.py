"""Windows equivalent of the exclusive nonblocking writer lock used by the ledger."""
import errno
import msvcrt

LOCK_EX = 2
LOCK_NB = 4
LOCK_UN = 8

def flock(file, operation):
    position = file.tell()
    try:
        file.seek(0)
        if operation == LOCK_UN:
            msvcrt.locking(file.fileno(), msvcrt.LK_UNLCK, 1)
        elif operation == LOCK_EX | LOCK_NB:
            try:
                msvcrt.locking(file.fileno(), msvcrt.LK_NBLCK, 1)
            except OSError as exc:
                if exc.errno in (errno.EACCES, errno.EAGAIN, errno.EDEADLK):
                    raise BlockingIOError(exc.errno, "Another ledger writer owns the file lock") from exc
                raise
        else:
            raise ValueError("Unsupported writer lock operation")
    finally:
        file.seek(position)
