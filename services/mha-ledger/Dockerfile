FROM python:3.12-slim
WORKDIR /app
COPY mha /app/mha
ENV PYTHONUNBUFFERED=1
RUN useradd --uid 10001 --create-home ledger && mkdir /data && chown ledger:ledger /data
USER ledger
ENV MHA_DB_PATH=/data/mha.sqlite3
CMD ["python", "-m", "mha", "run"]
