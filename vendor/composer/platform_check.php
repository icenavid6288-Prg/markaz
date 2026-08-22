<?php

if (!(PHP_VERSION_ID >= 80200)) {
    throw new \RuntimeException('Composer detected issues in your platform: Your Composer dependencies require a PHP version "<your version> >= 8.2.0".');
}
