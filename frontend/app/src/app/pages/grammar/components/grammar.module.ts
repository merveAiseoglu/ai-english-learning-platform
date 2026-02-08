/**
 * Grammar Module
 * Module configuration for grammar learning section
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GrammarTutorialComponent } from '../grammar-tutorial';
import { LevelSelectorComponent } from './level-selector.component';
import { TopicListComponent } from './topic-list.component';
import { TopicDetailComponent } from './topic-detail.component';

@NgModule({
  imports: [
    CommonModule,
    LevelSelectorComponent,
    TopicListComponent,
    TopicDetailComponent,
  ],
  declarations: []
})
export class GrammarModule {}