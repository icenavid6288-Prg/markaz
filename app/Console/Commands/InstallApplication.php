<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class InstallApplication extends Command
{
    protected $signature = 'app:install
        {--admin-name= : Name of the first administrator}
        {--admin-phone= : Mobile number of the first administrator}
        {--admin-password= : Password for the first administrator (for CLI use)}
        {--admin-password-stdin : Read the administrator password from standard input}
        {--admin-email= : Optional email address for the first administrator}';

    protected $description = 'Prepare the database and create the first super administrator';

    public function handle(): int
    {
        $name = trim((string) $this->option('admin-name'));
        $phone = trim((string) $this->option('admin-phone'));
        $password = $this->option('admin-password-stdin')
            ? rtrim((string) stream_get_contents(STDIN), "\r\n")
            : (string) $this->option('admin-password');
        $email = trim((string) $this->option('admin-email'));

        if ($name === '' || $phone === '' || $password === '') {
            $this->error('admin-name, admin-phone and admin-password are required.');

            return self::FAILURE;
        }

        if (mb_strlen($password) < 10) {
            $this->error('The administrator password must be at least 10 characters.');

            return self::FAILURE;
        }

        foreach ([
            ['migrate', ['--force' => true]],
            ['db:seed', ['--class' => 'RoleAndPermissionSeeder', '--force' => true]],
        ] as [$command, $arguments]) {
            if ($this->call($command, $arguments) !== self::SUCCESS) {
                $this->error("Installation command failed: {$command}");

                return self::FAILURE;
            }
        }

        // ContentSeeder needs an author, so create the custom administrator
        // before loading the initial public content.
        $user = User::query()->firstOrNew(['phone' => $phone]);
        // The User model hashes the password via the 'hashed' cast.
        $user->forceFill([
            'name' => $name,
            'phone' => $phone,
            'email' => $email !== '' ? $email : null,
            'password' => $password,
            'is_active' => true,
        ])->save();
        $user->syncRoles(['super-admin']);

        foreach ([
            ['db:seed', ['--class' => 'SiteSettingSeeder', '--force' => true]],
            ['db:seed', ['--class' => 'ContentSeeder', '--force' => true]],
        ] as [$command, $arguments]) {
            if ($this->call($command, $arguments) !== self::SUCCESS) {
                $this->error("Installation command failed: {$command}");

                return self::FAILURE;
            }
        }

        $this->info('Installation completed. The first administrator can sign in with the mobile number and password supplied to the installer.');

        return self::SUCCESS;
    }
}
