import Game from './game';
import { makeGame } from '../gameUtils';
import { db, SERVER_TIME } from './firebase';
import EventEmitter from 'events';

// a wrapper class that models Room
export default class Room extends EventEmitter {
  constructor(path) {
    super();
    this.path = path;
    this.ref = db.ref(path);
    this.ref.child('games').on('value', snapshot => {
      console.log('snapshot', snapshot.val());
      this.emit('games', snapshot.val());
    });
    this.ref.child('users').on('value', snapshot => {
      this.emit('users', snapshot.val());
    });
  }

  unload() {
    this.ref.child('games').off('value');
    this.ref.child('users').off('value');
  }

  listGames() {
  }

  sendChatMessage(uid, msg) {
    this.ref.child('chat').push({
      uid,
      msg,
    });
  }

  tickUser(uid) {
    this.ref.child('users').child(uid)
      .set({
        lastActive: SERVER_TIME,
      });
  }

  getGame(gid, options) {
    return new Game(`${this.path}/history/${gid}`, options);
  }

  createGame(pid, cbk) {
    const puzzleRef = db.ref(`/puzzle/${pid}`);
    const gamesRef = this.ref.child('games');
    puzzleRef.once('value', snapshot => {

      gamesRef.once('value', gamesSnapshot => {
        const gid = gamesSnapshot.numChildren() + 1;
        const puzzle = snapshot.val();
        const game = new Game(
          `${this.path}/history/${gid}`,
          {
            events: false,
          }
        );
        game.initialize(
          makeGame('', '', puzzle)
        );
        gamesRef.child(gid).set({
          gid,
          info: puzzle.info,
          progress: 0,
          solved: false,
          createdAt: SERVER_TIME,
          updatedAt: SERVER_TIME,
        });
        if (cbk) {
          cbk(gid);
        }
      });
    });
  }
};

