FROM ubuntu:22.04

RUN apt update -y && apt install -y \
    socat

RUN useradd -m ctf
WORKDIR /home/ctf

COPY start.sh /start.sh
COPY ./src/chall /home/ctf/
COPY ./src/l* /home/ctf/
COPY ./src/flag.txt /home/ctf/flag.txt
RUN mv /home/ctf/flag.txt "/home/ctf/flag-$(cat /flag.txt | md5sum | cut -d ' ' -f 1).txt"

RUN chown -R root:root /home/ctf
RUN chmod -R 555 /home/ctf
RUN chmod 555 /start.sh


USER ctf

CMD ["socat", "TCP-LISTEN:9999,reuseaddr,fork", "EXEC:/start.sh"]