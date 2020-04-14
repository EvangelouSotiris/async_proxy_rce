FROM mariadb:latest

RUN apt-get update & apt-get upgrade -y

EXPOSE 3306

ADD setup.sql /docker-entrypoint-initdb.d

