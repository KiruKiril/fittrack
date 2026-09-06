import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { ActiveLiveSession, LiveSessionTracker } from '../core/services/live-session-tracker';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.scss'
})
export class Shell {
  private auth = inject(AuthService);
  private router = inject(Router);
  liveSessionTracker = inject(LiveSessionTracker);

  username = this.auth.getUsername();

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  liveBannerQueryParams(session: ActiveLiveSession): { splitId?: number } {
    return session.splitId ? { splitId: session.splitId } : {};
  }
}
