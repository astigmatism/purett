FROM --platform=linux/amd64 php:5.6.40-apache

RUN docker-php-ext-install -j2 pdo_mysql \
    && a2enmod rewrite headers expires

ENV APACHE_DOCUMENT_ROOT=/var/www/app/public
WORKDIR /var/www/app

COPY docker/apache/purett.conf /etc/apache2/sites-available/000-default.conf
COPY docker/php.ini /usr/local/etc/php/conf.d/purett.ini
COPY application /var/www/app/application
COPY library/Zend /var/www/app/library/Zend
COPY library/Predis /var/www/app/library/Predis
COPY library/PureTripleTriad /var/www/app/library/PureTripleTriad
COPY library/Gamehouse/Controller /var/www/app/library/Gamehouse/Controller
COPY library/Standalone /var/www/app/library/Standalone
COPY public /var/www/app/public
COPY data/dialogs /var/www/app/data/dialogs
COPY cron /var/www/app/cron
COPY bin /var/www/app/bin
COPY scripts/scheduler-loop.sh /var/www/app/scripts/scheduler-loop.sh

RUN mkdir -p /var/www/app/var/gamehistory/tutorials /var/www/app/var/log /var/www/app/var/sessions \
    && chown -R www-data:www-data /var/www/app/var \
    && chmod 0755 /var/www/app/scripts/scheduler-loop.sh
