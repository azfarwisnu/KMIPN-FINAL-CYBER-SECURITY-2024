FROM ubuntu:22.04

RUN apt-get update -y && apt-get install -y \
    xinetd

RUN useradd -m ctf
WORKDIR /home/ctf

COPY ctf.xinetd /etc/xinetd.d/ctf
COPY start.sh /start.sh
COPY ./src/chall /home/ctf/
COPY ./src/flag.txt /home/ctf/flag.txt
RUN mv /home/ctf/flag.txt "/home/ctf/flag-$(cat /flag.txt | md5sum | cut -d ' ' -f 1).txt"

RUN chmod -R 755 /home/ctf
RUN chmod 755 /start.sh
RUN chmod +x /home/ctf/chall
RUN chown root:root /home/ctf
RUN chown root:root /start.sh

RUN chmod +x /start.sh

USER ctf

CMD ["/usr/sbin/xinetd","-dontfork"]
EXPOSE 9999
