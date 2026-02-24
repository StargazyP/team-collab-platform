module.exports = {
  apps: [
    {
      name: "nextjs-user-dev",
      cwd: "/home/jangdonggun/포트폴리오/nextjs/user",
      script: "npm",
      args: "run dev",
      interpreter: "none",

      env: {
        NODE_ENV: "development",
        PORT: 3000
      },

      autorestart: true,
      watch: false,
      max_memory_restart: "1G"
    }
  ]
}

