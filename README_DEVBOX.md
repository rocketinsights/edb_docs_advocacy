## Prerequisites
1. Install [Vagrant](https://www.vagrantup.com/downloads.html) based on your host OS.
2. Install [Virtualbox](https://www.virtualbox.org/wiki/Downloads) as your VM provider.

## Quickstart
1. Clone this repository
1. `cd` into project root directory and run `vagrant up`
1. Wait for vagrant to provision and launch the VM (You might get asked for your laptop password for it requires elevated privilege for some tasks)
2. Once `vagrant up` is finished, you can now log onto the VM using `vagrant ssh`.
3. If all went well, you should have ssh into the VM and the docs source code would be under `/home/vagrant/code` directory.  All required depedencies to run the server should be installed at this point.4. You can now run `yarn run develop-expose` to launch the server from your new dev VM and you should be able to access the doc server using `http://{vm.ip}:8000` where `vm.ip` value can be found in Vagrantfile configuration.  By default its `config.vm.network "private_network", ip: "192.168.1.77"`