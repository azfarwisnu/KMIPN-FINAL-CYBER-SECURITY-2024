FROM python:3.10-slim

RUN apt-get update -y && apt-get install -y \
    xinetd

RUN python3 -m pip install pycryptodome

RUN useradd -m ctf
WORKDIR /home/ctf

COPY ctf.xinetd /etc/xinetd.d/ctf
COPY src/soal.py /home/ctf/
COPY src/secret.py /home/ctf/

RUN chown root:ctf /home/ctf
RUN chmod -R 755 /home/ctf

USER ctf

EXPOSE 9999

CMD ["/usr/sbin/xinetd","-dontfork"]
