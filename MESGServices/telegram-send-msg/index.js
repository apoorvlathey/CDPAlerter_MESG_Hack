const Service = require('@liteflow/service')

const liteflow = new Service()

liteflow.listenTask({
  taskX: require('./tasks/send')
})
  .on('error', (error) => console.error(error))

liteflow.emitEvent('started', { x: true })
  .catch((error) => console.error(error))
