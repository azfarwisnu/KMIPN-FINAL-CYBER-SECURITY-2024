FROM python:3.10-slim

RUN apt update -y && apt install -y \
    socat

RUN python3 -m pip install pycryptodome

RUN useradd -m ctf
WORKDIR /home/ctf

COPY start.sh /start.sh
COPY src/soal.py /home/ctf/
COPY src/secret.py /home/ctf/
COPY src/pailier.py /home/ctf/


RUN chown -R root:root /home/ctf
RUN chmod -R 555 /home/ctf
RUN chmod 555 /start.sh

USER ctf

EXPOSE 9999

CMD ["socat", "TCP-LISTEN:9999,reuseaddr,fork", "EXEC:/start.sh"]
