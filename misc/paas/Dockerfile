# Use an official Python 2 image from the Docker Hub
FROM ubuntu:20.04

RUN apt-get update && apt-get install -y socat python2

RUN mkdir /app
WORKDIR /app

COPY src/chall.py .
COPY src/flag.txt /
COPY src/start.sh /

RUN chown -R root:root /app
RUN chmod -R 555 /app
RUN chown root:root /flag.txt
RUN chmod 555 /flag.txt

RUN chown root:root /start.sh
RUN chmod 555 /start.sh

RUN useradd ctf
USER ctf

CMD ["socat", "TCP-LISTEN:9999,reuseaddr,fork", "EXEC:/start.sh"]