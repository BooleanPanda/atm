!function () {
    window.addEventListener('load', () => {
        const model = new Model(
            [new Atm(0), new Atm(1), new Atm(2)],
            Person,
            Atm
            );
        const view = new View(model, {
            'atmSection' : document.getElementById('atmSection'),
            'queueSection' : document.getElementById('queueSection'),
            'startButton' : document.getElementById('startBtn'),
            'addPersonButton' : document.getElementById('addPersonBtn'),
            'addAtmButton' :  document.getElementById('addAtmBtn')
        });
        const controller = new Controller(model, view);

        view.render();
    });

    function randomNumInRange (min, max) {
        return (Math.floor(Math.random() * (max - min + 1)) + min);
    };

    class EventEmitter {
        constructor() {
            this._events = {};
          };
          on(event, listener) {
            (this._events[event] || (this._events[event] = [])).push(listener);
            return this;
          };
          emit(event, arg) {
            (this._events[event] || []).slice().forEach(lsn => lsn(arg));
          };
    };

    class Person {
        constructor() {
            this.time = randomNumInRange(2000,5000);
            this.color = randomNumInRange(1,8);
        };
    };

    class Atm {
        constructor(number) {
            this.free = false;
            this.number = number;
        };
        setModel (model) {
            this.model = model;
        };
        becomeFree () {
            this.free = true;
            this.model.atmBecomeFree(this.number);
        };
        servePerson (time) {
            this.free = false;
            setTimeout(()=>{this.becomeFree()}, time);
        };
    };

    class Model extends EventEmitter {
        constructor (atms) {
            super();
            this.atms = atms;
            this.queue = [];
            this.state = 'INIT';
        };

        startWorking () {
            this.state = 'WORKING';
            this.emit('working');
            this.atms.forEach(
                atm=>{
                    atm.setModel(this);
                    atm.becomeFree();
                }
            );
            this.queueGen();
        };

        addPerson () {
            const newPerson = new Person;
            this.queue.push(newPerson);
            this.emit('person added', newPerson.color);
            if (this.queue.length===1) {
                const index = this.atms.findIndex(atm => atm.free===true);
                if (index !== -1) {
                    this.serve(index);
                };
            };
        };

        addAtm () {
            const newAtm = new Atm (this.atms.length);
            newAtm.setModel(this);
            this.atms.push(newAtm);
            this.emit('atm added', newAtm.number);
            if(this.state==='WORKING') {
                this.atms[newAtm.number].becomeFree();
            };
        };

        deletePerson () {
            this.emit('person deleted');
            this.queue.splice(0,1);
        };

        atmBecomeFree (number) {
            this.emit('became free',number);
            this.serve(number);
        };

        serve (index) {
            if (this.queue.length>0) {
                this.atms[index].servePerson(this.queue[0].time);
                this.emit('became busy', [index,this.queue[0].color]);
                this.deletePerson();
            };
        };

        queueGen () {
            if(this.state==='WORKING') {
                this.addPerson();
                setTimeout(()=>{this.queueGen()}, randomNumInRange(500,1200));
            }
        };
    };

    class View extends EventEmitter {
        constructor (model, elements) {
            super();
            this._model = model;
            this._elements = elements;

            elements.startButton.addEventListener('click', () => this.emit('startClicked'));
            elements.addPersonButton.addEventListener('click', () => this.emit('addPersonClicked'));
            elements.addAtmButton.addEventListener('click', () => this.emit('addAtmClicked'));

            const queueSection = this._elements.queueSection;
            const atmSection = this._elements.atmSection;
            model.on('working', () => {elements.startButton.classList.toggle('controlsSection__button-disabled')})
                 .on('person added', (color) => { queueSection.appendChild(this.createPersonItem(color)) })
                 .on('person deleted', () => { queueSection.removeChild(queueSection.firstChild);})
                 .on('became free', (number) => {
                     atmSection.childNodes[number].classList.toggle('atmSection__item-busy');
                     atmSection.childNodes[number].innerHTML="";
                    })
                 .on('became busy', (args) => {
                     atmSection.childNodes[args[0]].classList.toggle('atmSection__item-busy');
                     atmSection.childNodes[args[0]].appendChild(this.createPersonItem(args[1]));
                    })
                 .on('atm added', (atm) => {atmSection.appendChild(this.createAtmItem(atm))})
        };

        createAtmItem (number) {
            const atm = document.createElement('div');
            atm.classList.add('atmSection__item');
            atm.classList.add('atmSection__item-busy');
            atm.setAttribute('id', `atm${number}`);
            return (atm);
        };

        createPersonItem (color) {
            const person = document.createElement('div');
            person.classList.add('queueSection__item');
            person.classList.add(`queueSection__item-${color}`);
            return (person);
        };

        render () {
            const atmSection = this._elements.atmSection;
            const queueSection = this._elements.queueSection;

            this._model.atms.forEach((e)=>{atmSection.appendChild(this.createAtmItem(e.number))});
            this._model.queue.forEach(()=>{queueSection.appendChild(this.createPersonItem())});
        };
    };

    class Controller {
        constructor (model, view) {
            this._model = model;
            this._view = view;
            view.on('startClicked', () => this.start());
            view.on('addPersonClicked', () => this.addPerson());
            view.on('addAtmClicked', () => this.addAtm());
        };

        start () {
            this._model.startWorking();
        };

        addPerson () {
            this._model.addPerson();
        };

        deletePerson () {
            this._model.deletePerson();
        };

        addAtm () {
            this._model.addAtm();
        }
    };
}();