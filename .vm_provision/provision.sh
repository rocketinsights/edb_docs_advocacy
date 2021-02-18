#!/bin/bash
sudo yum install -y epel-release
sudo yum install -y ansible
sudo cp -f /home/vagrant/provision/hosts /etc/ansible/hosts
sudo ansible-playbook /home/vagrant/provision/playbook/playbook.yml