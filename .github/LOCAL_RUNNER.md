# ThinkPad CI runner

Owner-triggered jobs use disposable Ubuntu 24.04 VMs on Charlie's ThinkPad
when the repository variable `THINKPAD_CI_ENABLED` is `true`. Outside pull
requests and bot-triggered workflows use GitHub-hosted runners. The controller
uses the existing GitHub CLI login on the host; jobs receive only their own
GitHub-issued credentials. No host directories or host Docker socket are mounted. Docker runs inside the VM.

The `github-local-runner` user service polls eligible queued jobs, registers an
ephemeral repository runner, executes one job in a KVM virtual machine, and removes the VM/container and
registration. It rotates between repositories and runs one job at a time,
limited to two CPUs and 4 GiB total RAM (3.5 GiB for the guest). It is normal for the repository's Runners
page to be empty while idle. The ThinkPad must be awake and online; jobs queue
while it is unavailable, and runner selection does not automatically fail over.

Host sources and configuration: `~/.local/share/github-local-runner/`.
Inspect the service with `systemctl --user status github-local-runner` and
`journalctl --user -u github-local-runner`. Pause it with
`systemctl --user stop github-local-runner`; resume with
`systemctl --user start github-local-runner`.

Set `THINKPAD_CI_ENABLED` to `false` in Settings → Secrets and variables →
Actions → Variables to route new jobs back to GitHub. Cancel and rerun jobs
already queued with the old selection. The manually dispatched **ThinkPad
runner smoke test** verifies checkout, Node/Python setup and basic isolation.
The smoke test also runs on the runner migration branch for initial validation.

The existing GitHub Pages build and deployment use the local pool. Production
remains served by the existing Cloudflare Worker; this runner migration changes
neither hosting nor domain routing. Standard public-repository GitHub runners
are already free; the routing switch can keep this repository on GitHub.
