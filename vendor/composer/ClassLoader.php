<?php

namespace Composer\Autoload;

class ClassLoader
{
    private $vendorDir;
    private $prefixLengthsPsr4 = [];
    private $prefixDirsPsr4 = [];
    private $prefixesPsr0 = [];
    private $classMap = [];
    private $classMapAuthoritative = false;
    private $useIncludePath = false;
    private $missingClasses = [];
    private $apcuPrefix;
    private $registered = false;

    public function __construct($vendorDir = null)
    {
        $this->vendorDir = $vendorDir;
    }

    public function getPrefixes()
    {
        if (! empty($this->prefixesPsr0)) {
            return call_user_func_array('array_merge', array_values($this->prefixesPsr0));
        }

        return [];
    }

    public function getPrefixesPsr4()
    {
        return $this->prefixDirsPsr4;
    }

    public function getClassMap()
    {
        return $this->classMap;
    }

    public function addClassMap(array $classMap)
    {
        $this->classMap = $this->classMap ? $classMap + $this->classMap : $classMap;
    }

    public function add($prefix, $paths, $prepend = false)
    {
        $paths = (array) $paths;
        if (! $prefix) {
            return;
        }
        $first = $prefix[0];
        if (! isset($this->prefixesPsr0[$first][$prefix])) {
            $this->prefixesPsr0[$first][$prefix] = $paths;
            return;
        }
        $this->prefixesPsr0[$first][$prefix] = $prepend
            ? array_merge($paths, $this->prefixesPsr0[$first][$prefix])
            : array_merge($this->prefixesPsr0[$first][$prefix], $paths);
    }

    public function addPsr4($prefix, $paths, $prepend = false)
    {
        $paths = (array) $paths;
        if (! $prefix) {
            return;
        }
        $length = strlen($prefix);
        if ('\\' !== $prefix[$length - 1]) {
            throw new \InvalidArgumentException('A non-empty PSR-4 prefix must end with a namespace separator.');
        }
        $this->prefixLengthsPsr4[$prefix[0]][$prefix] = $length;
        if (! isset($this->prefixDirsPsr4[$prefix])) {
            $this->prefixDirsPsr4[$prefix] = $paths;
            return;
        }
        $this->prefixDirsPsr4[$prefix] = $prepend
            ? array_merge($paths, $this->prefixDirsPsr4[$prefix])
            : array_merge($this->prefixDirsPsr4[$prefix], $paths);
    }

    public function set($prefix, $paths)
    {
        if (! $prefix) {
            return;
        }
        $this->prefixesPsr0[$prefix[0]][$prefix] = (array) $paths;
    }

    public function setPsr4($prefix, $paths)
    {
        $paths = (array) $paths;
        if (! $prefix) {
            return;
        }
        $length = strlen($prefix);
        if ('\\' !== $prefix[$length - 1]) {
            throw new \InvalidArgumentException('A non-empty PSR-4 prefix must end with a namespace separator.');
        }
        $this->prefixLengthsPsr4[$prefix[0]][$prefix] = $length;
        $this->prefixDirsPsr4[$prefix] = $paths;
    }

    public function setUseIncludePath($useIncludePath)
    {
        $this->useIncludePath = $useIncludePath;
    }

    public function getUseIncludePath()
    {
        return $this->useIncludePath;
    }

    public function setClassMapAuthoritative($classMapAuthoritative)
    {
        $this->classMapAuthoritative = $classMapAuthoritative;
    }

    public function isClassMapAuthoritative()
    {
        return $this->classMapAuthoritative;
    }

    public function setApcuPrefix($apcuPrefix)
    {
        $this->apcuPrefix = function_exists('apcu_fetch') && filter_var(ini_get('apc.enabled'), FILTER_VALIDATE_BOOLEAN)
            ? $apcuPrefix
            : null;
    }

    public function getApcuPrefix()
    {
        return $this->apcuPrefix;
    }

    public function register($prepend = false)
    {
        if ($this->registered) {
            return;
        }
        spl_autoload_register([$this, 'loadClass'], true, $prepend);
        $this->registered = true;
    }

    public function unregister()
    {
        spl_autoload_unregister([$this, 'loadClass']);
        $this->registered = false;
    }

    public function loadClass($class)
    {
        if ($file = $this->findFile($class)) {
            includeFile($file);

            return true;
        }

        return null;
    }

    public function findFile($class)
    {
        if (isset($this->classMap[$class])) {
            return $this->classMap[$class];
        }
        if ($this->classMapAuthoritative || isset($this->missingClasses[$class])) {
            return false;
        }
        $file = $this->findFileWithExtension($class, '.php');
        if ($file === false) {
            $this->missingClasses[$class] = true;
        }

        return $file;
    }

    private function findFileWithExtension($class, $ext)
    {
        $logicalPathPsr4 = strtr($class, '\\', DIRECTORY_SEPARATOR).$ext;
        $first = $class[0];
        if (isset($this->prefixLengthsPsr4[$first])) {
            foreach ($this->prefixLengthsPsr4[$first] as $prefix => $length) {
                if (str_starts_with($class, $prefix)) {
                    foreach ($this->prefixDirsPsr4[$prefix] as $dir) {
                        if (is_file($file = $dir.DIRECTORY_SEPARATOR.substr($logicalPathPsr4, $length))) {
                            return $file;
                        }
                    }
                }
            }
        }

        if (isset($this->prefixesPsr0[$first])) {
            $logicalPathPsr0 = strtr($class, '_', DIRECTORY_SEPARATOR).$ext;
            foreach ($this->prefixesPsr0[$first] as $prefix => $dirs) {
                if (str_starts_with($class, $prefix)) {
                    foreach ($dirs as $dir) {
                        if (is_file($file = $dir.DIRECTORY_SEPARATOR.$logicalPathPsr0)) {
                            return $file;
                        }
                    }
                }
            }
        }

        return false;
    }
}

function includeFile($file)
{
    include $file;
}
