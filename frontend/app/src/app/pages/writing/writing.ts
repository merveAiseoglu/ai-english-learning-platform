/**
 * Writing Component
 * Provides writing practice with prompts, tips, and history tracking
 * 
 * Features:
 * - Random writing prompts filtered by level and type
 * - Real-time word/character count
 * - Grammar checking with OpenAI
 * - Writing tips panel (quick tips, linking words, structure, vocabulary, patterns)
 * - Save drafts and completed writings
 * - Writing history with filters
 * - Progress tracking
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { 
  WritingService, 
  WritingPrompt, 
  WritingFilter, 
  LinkingWord, 
  StructureTemplate, 
  VocabularyWord, 
  SentencePattern 
} from '../../services/writing.service';
import { OpenAIService } from '../../openai.service';

/** Saved writing interface */
interface SavedWriting {
  id: string;
  promptId: number;
  promptTitle: string;
  promptLevel: string;
  promptType: string;
  content: string;
  wordCount: number;
  targetWords: number;
  completionPercentage: number;
  status: 'draft' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

@Component({
  selector: 'app-writing',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './writing.html',
  styleUrls: ['./writing.css']
})
export class Writing implements OnInit, OnDestroy {
  // Main properties
  userText: string = '';
  originalText: string = 'Hello, my name is John, I live in London.';
  correctedText: string = '';
  isCheckingGrammar: boolean = false;
  currentPrompt: WritingPrompt | null = null;
  
  // Filter properties
  selectedLevel: string = '';
  selectedType: string = '';
  availableLevels: string[] = [];
  availableTypes: string[] = [];
  
  // Save properties
  isSaving: boolean = false;
  saveMessage: string = '';
  messageType: 'success' | 'error' | 'info' = 'info';
  
  // History properties
  showHistory: boolean = false;
  savedWritings: SavedWriting[] = [];
  filteredWritings: SavedWriting[] = [];
  historyFilter: string = 'all';
  historyLevelFilter: string = '';
  
  // Tips panel properties
  private destroy$ = new Subject<void>();
  showTipsPanel: boolean = false;
  activeTab: string = 'quick';
  
  currentTips: any = {
    linkingWords: [],
    structureTemplates: [],
    vocabularySuggestions: [],
    sentencePatterns: []
  };
  
  linkingWordCategories: string[] = [];
  allStructureTemplates: StructureTemplate[] = [];
  
  tipsTabs = [
    { id: 'quick', name: 'Hızlı İpuçları', icon: '🎯' },
    { id: 'linking', name: 'Bağlaçlar', icon: '🔗' },
    { id: 'structure', name: 'Yapı', icon: '📚' },
    { id: 'vocabulary', name: 'Kelime Bilgisi', icon: '📖' },
    { id: 'patterns', name: 'Cümle Kalıpları', icon: '✍️' }
  ];

  constructor(
    private writingService: WritingService,
    private openaiService: OpenAIService
  ) {}

  ngOnInit(): void {
    // Load available filter options
    this.availableLevels = this.writingService.getAvailableLevels();
    this.availableTypes = this.writingService.getAvailableTypes();

    // Load saved writings
    this.loadSavedWritings();
    
    // Load tips data
    this.loadTipsData();

    // Subscribe to current prompt changes (main logic)
    this.writingService.currentPrompt$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(prompt => {
      this.currentPrompt = prompt;
      if (!this.isEditingExisting()) {
        this.userText = '';
      }
      this.clearMessage();
    });

    // Subscribe to current prompt changes (tips panel)
    this.writingService.currentPrompt$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.updateTipsForCurrentPrompt();
    });
  }


/** Grammar check using OpenAI */
  correctText(): void {
    // Eğer kullanıcı bir şey yazmadıysa boşuna sunucuya gitme
    if (!this.userText || this.userText.trim() === '') {
      this.showMessage('Lütfen önce bir metin yazın.', 'info');
      return;
    }

    this.isCheckingGrammar = true; // Yükleniyor animasyonu için (varsa)

    // DİKKAT: Burada 'this.originalText' yerine 'this.userText' kullanıyoruz.
    // Çünkü kullanıcının yazdığı yazıyı kontrol etmek istiyoruz.
    this.openaiService.correctGrammar(this.userText).subscribe(
      (response: any) => {
        // ARTIK BACKEND'DEN GELEN TEMİZ FORMATI OKUYORUZ
        if (response && response.success) {
          this.correctedText = response.correction;
          this.showMessage('Grammar kontrolü tamamlandı! ✅', 'success');
        } else {
          this.correctedText = 'Düzeltme önerisi alınamadı.';
        }
        this.isCheckingGrammar = false;
      },
      error => {
        console.error('Error occurred:', error);
        this.correctedText = 'Sunucuyla bağlantı kurulamadı.';
        this.showMessage('Hata oluştu ❌', 'error');
        this.isCheckingGrammar = false;
      }
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================
  // PROMPT MANAGEMENT
  // ========================

  getNewPrompt(): void {
    const filter: WritingFilter = {
      level: this.selectedLevel || undefined,
      type: this.selectedType || undefined
    };
    this.writingService.setRandomPrompt(filter);
  }
  
  onFilterChange(): void {
    this.getNewPrompt();
  }
  
  clearFilters(): void {
    this.selectedLevel = '';
    this.selectedType = '';
    this.onFilterChange();
  }
  
  // ========================
  // SAVING METHODS
  // ========================

  canSave(): boolean {
    return !!(this.currentPrompt && this.userText.trim() && !this.isSaving);
  }
  
  async saveWriting(): Promise<void> {
    if (!this.canSave()) return;
    this.isSaving = true;
    this.clearMessage();
    try {
      const savedWriting: SavedWriting = {
        id: this.generateId(),
        promptId: this.currentPrompt!.id,
        promptTitle: this.currentPrompt!.title,
        promptLevel: this.currentPrompt!.level,
        promptType: this.currentPrompt!.type,
        content: this.userText.trim(),
        wordCount: this.wordCount,
        targetWords: this.currentPrompt!.targetWords,
        completionPercentage: this.ProgressPercentage,
        status: this.ProgressPercentage >= 80 ? 'completed' : 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.saveToStorage(savedWriting);
      this.showMessage('Yazı başarıyla kaydedildi! 🎉', 'success');
    } catch (error) {
      this.showMessage('Yazı kaydedilemedi. Lütfen tekrar deneyin.', 'error');
    } finally {
      this.isSaving = false;
    }
  }
  
  async saveDraft(): Promise<void> {
    if (!this.userText.trim()) return;
    this.isSaving = true;
    this.clearMessage();
    try {
      const draftWriting: SavedWriting = {
        id: this.generateId(),
        promptId: this.currentPrompt?.id || 0,
        promptTitle: this.currentPrompt?.title || 'Taslak',
        promptLevel: this.currentPrompt?.level || 'Bilinmiyor',
        promptType: this.currentPrompt?.type || 'Taslak',
        content: this.userText.trim(),
        wordCount: this.wordCount,
        targetWords: this.currentPrompt?.targetWords || 0,
        completionPercentage: this.ProgressPercentage,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await new Promise(resolve => setTimeout(resolve, 800));
      this.saveToStorage(draftWriting);
      this.showMessage('Taslak başarıyla kaydedildi! 📝', 'success');
    } catch (error) {
      this.showMessage('Taslak kaydedilemedi. Lütfen tekrar deneyin.', 'error');
    } finally {
      this.isSaving = false;
    }
  }
  
  private saveToStorage(writing: SavedWriting): void {
    try {
      const existingWritings = this.getSavedWritings();
      existingWritings.push(writing);
      localStorage.setItem('saved-writings', JSON.stringify(existingWritings));
      this.loadSavedWritings();
    } catch (error) {
      throw new Error('Storage failed');
    }
  }
  
  private getSavedWritings(): SavedWriting[] {
    try {
      const saved = localStorage.getItem('saved-writings');
      if (!saved) return [];
      return JSON.parse(saved);
    } catch (error) {
      console.error('Error loading saved writings:', error);
      return [];
    }
  }
  
  private generateId(): string {
    return `writing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private showMessage(message: string, type: 'success' | 'error' | 'info'): void {
    this.saveMessage = message;
    this.messageType = type;
    if (type === 'success') {
      setTimeout(() => this.clearMessage(), 5000);
    }
  }
  
  private clearMessage(): void {
    this.saveMessage = '';
  }
  
  // ========================
  // HISTORY METHODS
  // ========================

  toggleHistory(): void {
    this.showHistory = !this.showHistory;
    if (this.showHistory) {
      this.loadSavedWritings();
    }
  }
  
  loadSavedWritings(): void {
    this.savedWritings = this.getSavedWritings().sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    this.applyHistoryFilter();
  }
  
  applyHistoryFilter(): void {
    let filtered = [...this.savedWritings];
    if (this.historyFilter !== 'all') {
      filtered = filtered.filter(w => w.status === this.historyFilter);
    }
    if (this.historyLevelFilter) {
      filtered = filtered.filter(w => w.promptLevel === this.historyLevelFilter);
    }
    this.filteredWritings = filtered;
  }
  
  getHistoryLevels(): string[] {
    return [...new Set(this.savedWritings.map(w => w.promptLevel))].sort();
  }
  
  getCompletedCount(): number {
    return this.savedWritings.filter(w => w.status === 'completed').length;
  }
  
  getDraftCount(): number {
    return this.savedWritings.filter(w => w.status === 'draft').length;
  }
  
  getPreview(content: string): string {
    const maxLength = 150;
    return content.length <= maxLength ? content : content.substring(0, maxLength) + '...';
  }
  
  formatDate(date: Date): string {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }
  
  viewWriting(writing: SavedWriting): void {
    this.showHistory = false;
    this.userText = writing.content;

    const prompt = this.writingService.getPromptById(writing.promptId);

    if (prompt) {
      this.writingService.setCurrentPrompt(prompt);
      this.currentPrompt = prompt;
    } else {
      const tempPrompt: WritingPrompt = {
        id: writing.promptId,
        title: writing.promptTitle,
        description: `Saved writing: ${writing.promptTitle}`,
        level: writing.promptLevel,
        type: writing.promptType,
        targetWords: writing.targetWords,
        tips: []
      };
      this.writingService.setCurrentPrompt(tempPrompt);
      this.currentPrompt = tempPrompt;
    }

    this.showMessage('Yazı görüntülenmek üzere yüklendi 👁️', 'info');
  }

  editWriting(writing: SavedWriting): void {
    this.showHistory = false;
    this.userText = writing.content;
    
    const prompt = this.writingService.getPromptById(writing.promptId);
    if (prompt) {
      this.writingService.setCurrentPrompt(prompt);
    } else {
      const tempPrompt: WritingPrompt = {
        id: writing.promptId,
        title: writing.promptTitle,
        description: `Editing: ${writing.promptTitle}`,
        level: writing.promptLevel,
        type: writing.promptType,
        targetWords: writing.targetWords,
        tips: []
      };
      this.writingService.setCurrentPrompt(tempPrompt);
    }
    
    this.deleteWritingById(writing.id, false);
    this.showMessage('Yazı düzenlenmek üzere yüklendi ✏️', 'info');
  }

  deleteWriting(id: string): void {
    if (confirm('Bu yazıyı silmek istediğinizden emin misiniz?')) {
      this.deleteWritingById(id, true);
      this.showMessage('Yazı başarıyla silindi 🗑️', 'success');
    }
  }

  deleteWritingById(id: string, reload: boolean = true): void {
    try {
      const writings = this.getSavedWritings();
      const filtered = writings.filter(w => w.id !== id);
      localStorage.setItem('saved-writings', JSON.stringify(filtered));
      if (reload) {
        this.loadSavedWritings();
      }
    } catch (error) {
      this.showMessage('Yazı silinemedi', 'error');
    }
  }
  
  clearAllHistory(): void {
    if (confirm('Tüm kayıtlı yazıları silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
      try {
        localStorage.removeItem('saved-writings');
        this.loadSavedWritings();
        this.showMessage('Tüm yazılar başarıyla silindi 🗑️', 'success');
      } catch (error) {
        this.showMessage('Geçmiş temizlenemedi', 'error');
      }
    }
  }

  private isEditingExisting(): boolean {
    return !!this.currentPrompt?.id;
  }

  get wordCount(): number {
    return this.userText.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  get characterCount(): number {
    return this.userText?.length || 0;
  }

  get ProgressPercentage(): number {
    if (!this.currentPrompt || this.currentPrompt.targetWords === 0) return 0;
    const percentage = (this.wordCount / this.currentPrompt.targetWords) * 100;
    return Math.min(Math.round(percentage), 100);
  }

  // ========================
  // TIPS PANEL METHODS
  // ========================

  toggleTipsPanel(): void {
    this.showTipsPanel = !this.showTipsPanel;
    if (this.showTipsPanel && this.currentPrompt) {
      this.smartTabSelection();
    }
  }

  closeTipsPanel(): void {
    this.showTipsPanel = false;
  }

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }

  private loadTipsData(): void {
    const writingTips = this.writingService.getWritingTips();
    this.linkingWordCategories = this.writingService.getLinkingWordCategories();
    this.allStructureTemplates = writingTips.structureTemplates;
  }

  private updateTipsForCurrentPrompt(): void {
    if (this.currentPrompt) {
      this.currentTips = this.writingService.getTipsForCurrentPrompt();
    }
  }

  /** Smart tab selection based on writing type */
  private smartTabSelection(): void {
    if (!this.currentPrompt) return;
    const type = this.currentPrompt.type.toLowerCase();
    if (['essay', 'report'].includes(type)) this.activeTab = 'structure';
    else if (['email', 'formal letter'].includes(type)) this.activeTab = 'patterns';
    else if (['opinion'].includes(type)) this.activeTab = 'linking';
    else if (['descriptive', 'narrative'].includes(type)) this.activeTab = 'vocabulary';
    else this.activeTab = 'quick';
  }

  getLinkingWordsByCategory(category: string): LinkingWord[] {
    return this.writingService.getLinkingWordsByCategory(category);
  }

  selectTemplate(template: StructureTemplate): void {
    this.showTemplateDetails(template);
  }

  private showTemplateDetails(template: StructureTemplate): void {
    const templateText = `${template.name} Structure:\n\n${template.structure.join('\n')}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(templateText).then(() => {
        this.showMessage('Şablon panoya kopyalandı!', 'success');
      });
    }
  }

  hasContentForTab(tabId: string): boolean {
    switch (tabId) {
      case 'quick': return !!(this.currentPrompt?.tips && this.currentPrompt.tips.length > 0);
      case 'linking': return this.currentTips.linkingWords.length > 0;
      case 'structure': return this.currentTips.structureTemplates.length > 0;
      case 'vocabulary': return this.currentTips.vocabularySuggestions.length > 0;
      case 'patterns': return this.currentTips.sentencePatterns.length > 0;
      default: return false;
    }
  }

  getTabBadgeCount(tabId: string): number {
    switch (tabId) {
      case 'linking': return this.currentTips.linkingWords.length;
      case 'structure': return this.currentTips.structureTemplates.length;
      case 'vocabulary': return this.currentTips.vocabularySuggestions.length;
      case 'patterns': return this.currentTips.sentencePatterns.length;
      default: return 0;
    }
  }
}