<?php

namespace Composer;

class InstalledVersions
{
    private static $installed;

    public static function getInstalledPackages()
    {
        return array_keys(self::getInstalled()['versions'] ?? []);
    }

    public static function isInstalled($packageName, $includeDevRequirements = true)
    {
        $installed = self::getInstalled();

        return isset($installed['versions'][$packageName]);
    }

    public static function satisfies($versionParser, $packageName, $constraint)
    {
        $constraint = $versionParser->parseConstraints($constraint);
        $provided = $versionParser->parseConstraints(self::getVersionRanges($packageName));

        return $provided->matches($constraint);
    }

    public static function getVersionRanges($packageName)
    {
        $pretty = self::getPrettyVersion($packageName);

        return $pretty ?: '0.0.0.0';
    }

    public static function getVersion($packageName)
    {
        return self::getInstalled()['versions'][$packageName]['version'] ?? null;
    }

    public static function getPrettyVersion($packageName)
    {
        return self::getInstalled()['versions'][$packageName]['pretty_version'] ?? null;
    }

    public static function getReference($packageName)
    {
        return self::getInstalled()['versions'][$packageName]['reference'] ?? null;
    }

    public static function getInstallPath($packageName)
    {
        return self::getInstalled()['versions'][$packageName]['install_path'] ?? null;
    }

    public static function getRootPackage()
    {
        return self::getInstalled()['root'];
    }

    public static function getRawData()
    {
        return self::getInstalled();
    }

    public static function reload($data)
    {
        self::$installed = $data;
    }

    private static function getInstalled()
    {
        if (self::$installed === null) {
            self::$installed = require __DIR__.'/installed.php';
        }

        return self::$installed;
    }
}
