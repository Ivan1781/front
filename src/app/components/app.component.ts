import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MusicSheetComponent } from './music-sheet.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, MusicSheetComponent],
  templateUrl: './templates/app.component.html',
  styleUrl: './styles/app.component.css'
})
export class AppComponent {
  name = 'front';
}
