import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Boss } from '../models/boss.model';
import { BossService } from '../services/boss.service';

@Component({
  selector: 'app-choose-boss',
  templateUrl: './choose-boss.component.html',
  styleUrls: ['./choose-boss.component.scss']
})
export class ChooseBossComponent implements OnInit {
  bosses: Boss[] = [];
  bossRows: any[] = [];

  constructor(private router: Router, private service: BossService) { }

  ngOnInit(): void {
    this.service.getBosses().subscribe(
      (bosses: Boss[]) => {
        this.bosses = bosses;

        var row = [];
        var columnCount = 1;
        for (var i = 0; i < this.bosses.length; i++) {
          if (columnCount % 3 == 0) {
            this.bossRows.push(row);
            row = [];
          }
          row.push(this.bosses[i]);
          columnCount += 1
        }
        this.bossRows.push(row);
      })
  }

  choose(valueEmitted: string) {
    let values = valueEmitted.split("|")
    let name = "";
    let hitPoints = 0;
    let hitPointIndex = 0;

    if (values[1] == "medium") {
      hitPointIndex = 1;
    } else if (values[1] == "hard") {
      hitPointIndex = 2
    }
    

    for (var i = 0; i < this.bosses.length; i++) {
      if (this.bosses[i].id == values[0]) {
        name = this.bosses[i].name;
        hitPoints = this.bosses[i].hitPoints[hitPointIndex];
        break;
      }
    }
    this.router.navigate(['/game', { bossId: values[0], difficulty: values[1], name: name, hitPoints: hitPoints}]);
  }

}
