<?php

namespace Composer\Autoload;

class ComposerStaticInitMarkaz
{
    public static $files = array();
    public static $prefixLengthsPsr4 = array();
    public static $prefixDirsPsr4 = array();
    public static $classMap = array();
    public static function getInitializer(ClassLoader $loader)
    {
        return \Closure::bind(function () use ($loader) {
            $loader->prefixLengthsPsr4 = ComposerStaticInitMarkaz::$prefixLengthsPsr4;
            $loader->prefixDirsPsr4 = ComposerStaticInitMarkaz::$prefixDirsPsr4;
            $loader->classMap = ComposerStaticInitMarkaz::$classMap;
        }, null, ClassLoader::class);
    }
}
