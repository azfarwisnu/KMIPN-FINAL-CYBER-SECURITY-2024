FROM ubuntu:22.04

RUN apt update -y && apt install -y \
    xinetd

RUN useradd -m ctf
WORKDIR /home/ctf

COPY ctf.xinetd /etc/xinetd.d/ctf
COPY start.sh /start.sh
COPY ./src/chall /home/ctf/
COPY ./src/l* /home/ctf/
COPY ./src/flag.txt /home/ctf/flag.txt
RUN mv /home/ctf/flag.txt "/home/ctf/flag-$(cat /flag.txt | md5sum | cut -d ' ' -f 1).txt"

RUN chmod -R 755 /home/ctf 
RUN chmod +x /home/ctf/chall
RUN chown -R root:root /home/ctf
RUN chmod 755 /start.sh
RUN chown root:root /start.sh

USER ctf
EXPOSE 9999

CMD ["/usr/sbin/xinetd","-dontfork"]