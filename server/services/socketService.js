const initSocket = (io) => {
  if (!io) {
    return;
  }

  io.on('connection', (socket) => {
    socket.on('subscribe:station', (stationId) => {
      if (!stationId) {
        return;
      }

      socket.join(`station:${stationId}`);
    });

    socket.on('unsubscribe:station', (stationId) => {
      if (!stationId) {
        return;
      }

      socket.leave(`station:${stationId}`);
    });
  });
};

const emitChargerUpdate = (io, stationId, data) => {
  if (!io || !stationId) {
    return;
  }

  io.to(`station:${stationId}`).emit('charger:status_update', data);
};

const emitNewStation = (io, station) => {
  if (!io) {
    return;
  }

  io.emit('station:new', station);
};

module.exports = {
  initSocket,
  emitChargerUpdate,
  emitNewStation,
};
