//topic-detail.components.ts
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { GrammarTopicDetail, GrammarExample } from '../../../shared/models/grammar.models';
import { GrammarService } from '../../../services/grammar.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-topic-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topic-detail.component.html',
  styleUrls: ['./topic-detail.component.css']
})
export class TopicDetailComponent implements OnChanges {
  quizResponses: number[] = [];
  showResults = false;
  correctCount = 0;

  @Input() selectedTopicId: string | null = null;

  topicDetail: GrammarTopicDetail | null = null;
  loading = false;
  activeTab: 'explanation' | 'examples' | 'rules' | 'quizzes' = 'explanation';

  // Örnek çeviri görünürlük durumu
  expandedExamples = new Set<number>();

  constructor(private grammarService: GrammarService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedTopicId'] && this.selectedTopicId) {
      this.loadTopicDetail();
      this.activeTab = 'explanation';
    }
  }

  private loadTopicDetail(): void {
    if (!this.selectedTopicId) return;

    this.loading = true;
    this.grammarService.getTopicDetail(this.selectedTopicId).subscribe({
      next: (detail) => {
        this.topicDetail = detail;
        this.expandedExamples.clear(); // önceki örnek görünürlüklerini sıfırla
        this.loading = false;
      },
      error: (error) => {
        console.error('Konu detayı yüklenirken hata:', error);
        this.loading = false;
      }
    });
  }

  setActiveTab(tab: 'explanation' | 'examples' | 'rules' | 'quizzes'): void {
    this.activeTab = tab;
  }

  getExamples(): GrammarExample[] {
    return this.topicDetail?.examples || [];
  }

  toggleExample(index: number): void {
    if (this.expandedExamples.has(index)) {
      this.expandedExamples.delete(index);
    } else {
      this.expandedExamples.add(index);
    }
  }

  isExpanded(index: number): boolean {
    return this.expandedExamples.has(index);
  }

  // Quizleri al
  getQuizzes() {
    return this.topicDetail?.quizzes || [];
  }

  selectAnswer(questionIndex: number, optionIndex: number) {
    this.quizResponses[questionIndex] = optionIndex;
  }

  submitQuiz() {
    this.correctCount = 0;
    this.topicDetail?.quizzes?.forEach((q: any, i: number) => {
      // String answer'ı index'e çevir
      const correctAnswerIndex = q.options.indexOf(q.answer);
      if (this.quizResponses[i] === correctAnswerIndex) {
        this.correctCount++;
      }
    });
    this.showResults = true;
  }

  resetQuiz(): void {
    this.quizResponses = [];
    this.showResults = false;
    this.correctCount = 0;
  }

  isCorrect(questionIndex: number): boolean {
    if (!this.topicDetail?.quizzes) return false;
    const question = this.topicDetail.quizzes[questionIndex];
    const correctAnswerIndex = question.options.indexOf(question.answer);
    return this.quizResponses[questionIndex] === correctAnswerIndex;
  }

  // Doğru cevabın index'ini döndür
  getCorrectAnswerIndex(question: any): number {
    return question.options.indexOf(question.answer);
  }
}