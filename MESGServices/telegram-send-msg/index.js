const Service = require('@mesg/service')

const mesg = new Service()

mesg.listenTask({
  taskX: require('./tasks/send')
})
  .on('error', (error) => console.error(error))

mesg.emitEvent('started', { x: true })
  .catch((error) => console.error(error))
