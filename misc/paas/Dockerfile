# Use an official Python 2 image from the Docker Hub
FROM ubuntu:20.04

RUN apt-get update && apt-get install -y socat

RUN mkdir /app
WORKDIR /app

COPY src/chall.py .
COPY src/flag.txt /flag.txt

RUN chown -R root:root /app
RUN chown root:root /flag.txt
RUN chmod -R 555 /app
RUN chmod 555 /flag.txt

EXPOSE 9999
EXPOSE 30000-39999

RUN useradd ctf
USER ctf

CMD ["socat", "TCP-LISTEN:9999,reuseaddr,fork", "EXEC:python2 /app/chall.py"]