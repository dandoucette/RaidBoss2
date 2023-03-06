import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChooseBossComponent } from './choose-boss/choose-boss.component';
import { GameComponent } from './game/game.component';

const routes: Routes = [
  {
    path: '',
    component: ChooseBossComponent
  },
  { 
    path: 'game',
    component: GameComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
