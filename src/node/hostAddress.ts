import os from 'os'

// 获取本机电脑IP
function getIPAdress() {
  const interfaces = os.networkInterfaces()
  for (const devName in interfaces) {
    const iface: any = interfaces[devName]
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i]
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        // console.log(alias.address);

        return alias.address
      }
    }
  }
}

const host = `http://${getIPAdress() || 'localhost'}:8080` //'http://localhost:8080'

export default host
