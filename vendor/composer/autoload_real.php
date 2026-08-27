<?php

class ComposerAutoloaderInitMarkaz
{
    private static $loader;

    public static function getLoader()
    {
        if (null !== self::$loader) {
            return self::$loader;
        }

        require __DIR__.'/platform_check.php';
        require_once __DIR__.'/ClassLoader.php';

        self::$loader = $loader = new \Composer\Autoload\ClassLoader(__DIR__);

        $map = require __DIR__.'/autoload_namespaces.php';
        foreach ($map as $namespace => $path) {
            $loader->set($namespace, $path);
        }

        $map = require __DIR__.'/autoload_psr4.php';
        foreach ($map as $namespace => $path) {
            $loader->setPsr4($namespace, $path);
        }

        $classMap = require __DIR__.'/autoload_classmap.php';
        if ($classMap) {
            $loader->addClassMap($classMap);
        }

        $loader->register(true);

        $includeFiles = require __DIR__.'/autoload_files.php';
        foreach ($includeFiles as $fileIdentifier => $file) {
            composerRequireMarkaz($fileIdentifier, $file);
        }

        return $loader;
    }
}

function composerRequireMarkaz($fileIdentifier, $file)
{
    if (empty($GLOBALS['__composer_autoload_files'][$fileIdentifier])) {
        $GLOBALS['__composer_autoload_files'][$fileIdentifier] = true;
        require $file;
    }
}
