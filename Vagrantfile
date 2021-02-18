# Determine host os
module OS
    def OS.windows?
        (/cygwin|mswin|mingw|bccwin|wince|emx/ =~ RUBY_PLATFORM) != nil
    end
  
    def OS.mac?
        (/darwin/ =~ RUBY_PLATFORM) != nil
    end
  
    def OS.unix?
        !OS.windows?
    end
  
    def OS.linux?
        OS.unix? and not OS.mac?
    end
  end
  
  Vagrant.configure("2") do |config|
    
    config.vm.box = "centos/7"
    config.vagrant.plugins = ["vagrant-notify-forwarder"]
    
    if OS.windows?
      puts "Launching from windows host"
    elsif OS.mac?
      puts "Launching from macos host"
    elsif OS.linux?
      puts "Launching from linux host"
    else
      puts "Launching from unknown host"
    end
  
    if OS.windows?
      config.vm.provider "virtualbox" do |v|
        puts "Configuring vb to allow symlink creation"
        v.memory = 4000
        v.cpus = 1
        v.customize ["setextradata", :id, "VBoxInternal2/SharedFoldersEnableSymlinksCreate/v-root", "1"] # allows symbolic links in shared folders
        v.customize ["modifyvm", :id, "--natdnshostresolver1", "on"] # this flag allows the vm to access through VPN
      end
    else
      config.vm.provider "virtualbox" do |v|
        v.memory = 4000
        v.cpus = 1
        v.customize ["modifyvm", :id, "--natdnshostresolver1", "on"]
      end
    end
  
    if OS.mac? || OS.linux?
      # if mac or linux host machines, we use private network + nfs sharing
      config.vm.network "private_network", ip: "192.168.1.77"
      config.vm.synced_folder ".", "/home/vagrant/code", type: "nfs", create: true
    else
    # Configure forward port as needed
    # config.vm.network "forwarded_port", 
    # guest: 4201, host: 4201, 
      config.vm.synced_folder ".", "/home/vagrant/code", create: true
    end
  
    config.ssh.forward_agent = true
  
    config.vm.provision "file", source: "./.vm_provision", destination: "~/provision"
    config.vm.provision "shell",
      inline: "sh /home/vagrant/provision/provision.sh"
  end