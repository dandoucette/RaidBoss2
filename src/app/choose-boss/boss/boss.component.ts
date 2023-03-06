import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-boss',
  templateUrl: './boss.component.html',
  styleUrls: ['./boss.component.scss']
})
export class BossComponent implements OnInit {
  @Input() bossId: string = "";
  @Input() bossName: string = "";
  @Input() bossSubtitle: string = "";
  @Input() description: string = "";
  @Input() imagePath: string = "";
  @Input() colours: string[] = [];
  @Input() hitPoints: number[] = [];
  @Output() difficultySelected: EventEmitter<string> = new EventEmitter<string>();

  constructor() { }

  ngOnInit(): void {}

  buttonClicked(bossId: string, difficulty: string) {
    this.difficultySelected.emit(`${bossId}|${difficulty}`);
  }

}
