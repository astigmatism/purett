Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/jammy64"
  config.vm.hostname = "purett-standalone"
  config.vm.network "forwarded_port", guest: 8080, host: 8080, host_ip: "127.0.0.1", auto_correct: false
  config.vm.synced_folder ".", "/opt/purett", type: "rsync", rsync__exclude: [".env", "var", "data/logs", "purettv2", "public/wordpress"]

  config.vm.provider "virtualbox" do |vb|
    vb.memory = 3072
    vb.cpus = 2
  end

  config.vm.provision "shell", path: "scripts/provision-vm.sh"
end
