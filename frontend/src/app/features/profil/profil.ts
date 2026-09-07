import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { extractErrorMessage } from '../../core/error-message';

@Component({
  selector: 'app-profil',
  imports: [FormsModule],
  templateUrl: './profil.html',
  styleUrl: './profil.scss'
})
export class Profil {
  private auth = inject(AuthService);
  private userPreferencesService = inject(UserPreferencesService);

  username = this.auth.getUsername();
  planungshorizontWochen: number | null = null;

  loading = signal(true);
  saving = signal(false);
  saved = signal(false);
  error = signal<string | null>(null);

  constructor() {
    this.userPreferencesService.get().subscribe({
      next: (prefs) => {
        this.planungshorizontWochen = prefs.planungshorizontWochen;
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Präferenzen konnten nicht geladen werden.'));
        this.loading.set(false);
      }
    });
  }

  speichern(): void {
    this.error.set(null);
    this.saved.set(false);
    if (!this.planungshorizontWochen || this.planungshorizontWochen < 1 || this.planungshorizontWochen > 8) {
      this.error.set('Planungshorizont muss zwischen 1 und 8 Wochen liegen.');
      return;
    }

    this.saving.set(true);
    this.userPreferencesService.update(this.planungshorizontWochen).subscribe({
      next: (prefs) => {
        this.planungshorizontWochen = prefs.planungshorizontWochen;
        this.saving.set(false);
        this.saved.set(true);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(extractErrorMessage(err, 'Präferenzen konnten nicht gespeichert werden.'));
      }
    });
  }
}
