import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BossAbility } from '../models/boss-ability.model';
import { Defender } from '../models/defender.model';
import { Roll } from '../models/roll.model';
import { BossService } from '../services/boss.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {
  bossAbilities: BossAbility[] = [];
  numberOfPlayers: number = 1;
  turnCounter: number = 1;
  diceRolls!: Roll[];
  bossName!: string;
  bossHitPoints!: number;
  bossPoison: number = 0;
  gameStarted: boolean = false;
  bossDefenders: Defender[] = [];
  bossForm!: FormGroup;
  controlNames = {
    Damage: "damage",
    Poison: "poison",
    CardsMilled: "cards-milled"
  }
  playerTurn: boolean = true;
  bossCardsRemaining: number = 100;

  constructor(private route: ActivatedRoute, private service: BossService) { }

  ngOnInit(): void {
    const bossId = this.route.snapshot.paramMap.get("bossId");
    const difficulty = this.route.snapshot.paramMap.get("difficulty");
    this.bossName = this.route.snapshot.paramMap.get("name") ?? '';
    this.bossHitPoints = Number(this.route.snapshot.paramMap.get("hitPoints")) ?? 0;

    if(bossId && difficulty) {
      this.service.getBossAbilities(bossId, difficulty).subscribe(
        (abilities: BossAbility[]) => {
          this.bossAbilities = abilities;
        });
    }

    this.initForm();
  }

  private initForm() {
    this.bossForm = new FormGroup({
      [this.controlNames.Damage]: new FormControl(0),
      [this.controlNames.Poison]: new FormControl(0),
      [this.controlNames.CardsMilled]: new FormControl(0)
    });
  }


  startGameClick() {
    this.gameStarted = true;
    this.bossHitPoints = this.bossHitPoints * this.numberOfPlayers
  }

  bossTurnClick() {
    this.playerTurn = false;
    this.bossHitPoints -= this.bossForm.get(this.controlNames.Damage)?.value;
    this.bossPoison += this.bossForm.get(this.controlNames.Poison)?.value;
    this.bossCardsRemaining -= this.bossForm.get(this.controlNames.CardsMilled)?.value;

    this.diceRolls = [];

    if (this.bossHitPoints <= 0 || this.bossPoison >= 10 || this.bossCardsRemaining <= 0) {
      for (var i = 0; i < 10; i++) {
        const roll: Roll = {
          dieValue: 0,
          ability: "You Win!!!"
        }
        this.diceRolls.push(roll);
      }
      return;
    }

    if (this.turnCounter == 1) {
      const roll: Roll = {
        dieValue: 0,
        ability: "The boss does nothing"
      }
      this.diceRolls.push(roll);
    } else {

      let rolls = 0
      
      if (this.turnCounter % 2 == 0) {
        rolls = this.turnCounter / 2;
      } else {
        rolls = (this.turnCounter - 1) / 2;
      }

      for (var i = 1; i <= rolls; i++) {
        let duplicate: boolean = true;
        var dieRoll: number = 0;
        var exitCount: number = 0;

        while(duplicate) {
          dieRoll = this.rollaDie();
          if(!this.diceRolls.find(x => x.dieValue == dieRoll)) {
            duplicate = false;
          }

          // exit loop after too many tries
          if (exitCount > 10) {
            break;
          }
          exitCount++;
        }

        
        var ability = this.getBossAbilityFromDieRoll(dieRoll);
        var abilityText = this.processAbility(ability, rolls);

        const roll: Roll = {
          dieValue: dieRoll,
          ability: abilityText
        }
        this.diceRolls.push(roll);
      }

      this.bossCardsRemaining -= rolls + 1;
    }
  }

  nextTurnClick() {
    this.playerTurn = true;
    this.turnCounter += 1;
    this.diceRolls = [];
    this.initForm();
  }


  private rollaDie() {
    return Math.floor(Math.random() * (20) + 1);
  }

  private getBossAbilityFromDieRoll(dieRoll: number): BossAbility {
    for (var i = 0; i < this.bossAbilities.length; i++) {
      if (this.bossAbilities[i].dice.indexOf(dieRoll) > -1) {
        return this.bossAbilities[i];
      }
    }

    const empty: BossAbility = {
      dice: [0],
      bossEffect: "",
      text: "not found"
    }
    return empty;
  }

  private processAbility(ability: BossAbility, rolls: number): string {
    var text = ability.text.split("{x}").join(String(rolls));
    var amount: number = rolls;

    if (text.indexOf("{xp}") > 0) {
      amount = this.numberOfPlayers * rolls;
      text = text.replace("{xp}", String(amount));
    }

    // check for a single amount
    const fixedPattern = /\{\d{1}\}/;
    if (fixedPattern.test(text)) {
      var match = text.match(fixedPattern);
      if (match != null) {
        amount = Number(match[0].substring(1,2));
        text = text.replace(match[0], String(amount));
      }
    }

    // checks for a formula pattern, i.e. {x*2}, {X+1}, {x/2}
    const formulaPattern = /\{x(\+|\*|\/)\d{1}\}/;
    if(formulaPattern.test(text)) {
      var match = text.match(formulaPattern);
      if (match != null) {
        
        var operator = match[0].substring(2,3);
        var constant = Number(match[0].substring(3,4));

        if (operator == "+") {
          amount = rolls + constant;
        } else if (operator == "*") {
          amount = rolls * constant;
        } else if (operator == "/") {
          // divide is always by 2, too hard to make it anything else
          amount = this.divideByTwo(rolls);
        }

        text = text.replace(match[0], String(amount));
      }
    }

    // checks for a fixed amount multiplied by the players
    const fixedAmountPattern = /\{\d{1}\*p\}/;
    if (fixedAmountPattern.test(text)) {
      var match = text.match(fixedAmountPattern);
      if (match != null) {
        var fixedAmount = Number(match[0].substring(1,2));
        amount = fixedAmount * this.numberOfPlayers;
        text = text.replace(match[0], String(amount));
      }
    }

    // check for a random placeholder, this is signaled by an r with the bottom and top numbers
    const randomAmountPattern = /\{r,\d{1},\d{1,2}\}/;
    if (randomAmountPattern.test(text)) {
      var match = text.match(randomAmountPattern);
      if (match != null) {
        var min = Number(match[0].substring(3,4));
        var max = Number(match[0].substring(5,7).replace('}', ''));

        let choice = Math.floor(Math.random() * (max - min) + min);

        text = text.replace(match[0], String(choice));
      }
    }

    // sometimes the amount is multiplied by players
    // this is for that case
    if (text.indexOf("{amount*p}") > -1) {
      amount = amount * this.numberOfPlayers;
      text = text.replace("{amount*p}", String(amount));
    }


    // eventually could expand this for more boss effects
    if (ability.bossEffect != "") {
      var parts = ability.bossEffect.split(',');
      var effect = parts[0];
      var secondEffect = "";

      if (parts.length > 3) {
        secondEffect = parts[2];
      }

      if (effect == "life") {
        if (parts[1] == "amount") {
          this.bossHitPoints += amount;
        } else {
          this.bossHitPoints += Number(parts[1]);
        }
      } else if (effect == "creatures") {
        let numberOfCreatures = parts[1];
        var creatures = 0;
        
        if (numberOfCreatures == "x") {
          creatures = rolls;
        } else if (numberOfCreatures == "xp") {
          creatures = rolls * this.numberOfPlayers;
        } else if (numberOfCreatures.indexOf("x+") > -1) {
          let equation = numberOfCreatures.split("+");
          creatures = rolls + Number(equation[1]);
        } else if (numberOfCreatures == "x/2") {
          creatures = this.divideByTwo(rolls);
        } else {
          creatures = Number(numberOfCreatures);
        }

        for (var i = 0; i < creatures; i++) {
          let size = parts[2].split("/");
          let power = size[0];
          let toughness = size[1];

          if (power == "x") {
            power = String(rolls);
          }
          if (toughness == "x") {
            toughness = String(rolls);
          }

          const defender: Defender = {
            ability: "defender",
            power: Number(power),
            toughness: Number(toughness)
          }

          this.bossDefenders.push(defender);
        }
      }

      if (secondEffect != "") {
        if (secondEffect == "poison") {
          this.bossPoison += Number(parts[3]);
          if (this.bossPoison < 0) {
            this.bossPoison = 0;
          }
        }
      }
    }

    return text;
  }

  destroyDefender(power: number) {
    let index = this.bossDefenders.findIndex(d => d.power == power);
    if (index > -1) {
      this.bossDefenders.splice(index, 1);
    }
  }

  private divideByTwo(value: number) {
    if (value % 2 == 0) {
      return value / 2;
    } else {
      return (value + 1) / 2
    }
  }

}
