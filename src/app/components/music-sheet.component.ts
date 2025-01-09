import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Renderer, Stave, StaveNote, TabNote, Vex} from 'vexflow'; 


@Component({
  selector: 'app-music-sheet',
  standalone: true,
  templateUrl: './templates/music-sheet.component.html',
  styleUrls: ['./styles/music-sheet.component.css']
})
export class MusicSheetComponent implements OnInit, AfterViewInit {
  
  private currentStave!:Stave;

  private initialYStaveCoordinate: number = 0;

  private renderer!: Renderer;
  private svgContainer: HTMLDivElement | null = null;
  private context: any;
  private currentNotes: StaveNote[] = [];

  private notes: StaveNote[][] = [];

  private staves: Stave[] = [];
  
  selectedNote: string = "c/4";
  selectedDuration: string = "1";


  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initializeStave();
  }

  private initializeStave(): void {
    this.svgContainer = document.getElementById('music-sheet') as HTMLDivElement;
    
    this.renderer = new Renderer(this.svgContainer, Renderer.Backends.SVG);
    this.context = this.renderer.getContext();

    
    
    this.updateStaveSize();
    
    // document.addEventListener('click', (event) => {
    //   console.log("Viewport-relative:", event.clientX, event.clientY); // Relative to viewport
    //   console.log("Document-relative:", event.pageX, event.pageY); // Relative to document
    // });

      this.currentStave = new Stave(0, this.initialYStaveCoordinate, this.svgContainer.offsetWidth);
      this.currentStave.addTimeSignature("4/4");
      this.currentStave.addClef('treble').setContext(this.context).draw();

      this.staves.push(this.currentStave);

      window.addEventListener('resize', () => {
        this.updateStaveSize();
    }); 
  }

  private updateStaveSize(): void {
      if (!this.svgContainer) return;

      const containerBoundingRect = this.svgContainer.getBoundingClientRect();
      this.renderer.resize(containerBoundingRect.width, containerBoundingRect.height);
      if (this.currentStave) {
          this.currentStave.setWidth(containerBoundingRect.width);
          this.context.clear(); 
          this.currentStave.setContext(this.context).draw();
      }
  }

  onNoteChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null; 
    if (target) {
      this.selectedNote = target.value;
    }
  }

  onDurationChange(event: Event): void {
    const duration = event.target as HTMLSelectElement | null;
    if(duration) {
      this.selectedDuration = duration.value;
    }
  }

  onMeasure(): void {}

  addNote(): void {
    const note = new StaveNote({    
      clef: "treble", 
      keys: [this.selectedNote],
      duration: this.selectedDuration 
    }); 
    this.renderNotes(note);
  }

  private renderNotes(newNote:StaveNote): void {
    if (!this.currentStave || !this.context) return;

    this.context.clear();

    // add newNote to the notes array of current stave
    this.currentNotes.push(newNote);

    // draw all staves
    this.staves.forEach((stave)=> stave.setContext(this.context).draw());
    
    // calculate the duration of stave
    let durations: number[] = this.currentNotes.map((a)=> Number(a.getDuration()));
    console.log(durations);
    let staveDuration = durations.reduce( (a,b)=> a + 1/b, 0 );
    console.log(staveDuration)
    
    // if stave completed:
    if (staveDuration == 1) {
      let nextStave = null;
      if(this.svgContainer) {

        // push the notes array of completed stave to the whole note set 
        this.notes.push(this.currentNotes);
        
        // let timeSignature: {
        //   bar: number;
        //   beat: number
        // }

        this.initialYStaveCoordinate += 120;

        nextStave = new Stave(0, this.initialYStaveCoordinate, this.svgContainer.offsetWidth);  
        nextStave.addTimeSignature("4/4");
        // nextStave.addClef('treble');
        this.staves.push(nextStave);
          
        const beams = Vex.Flow.Beam.generateBeams(this.currentNotes);
        Vex.Flow.Formatter.FormatAndDraw(this.context, this.currentStave, this.currentNotes);
        
        this.renderPreviousStaves();

        // draw the note of current stave
        beams.forEach((b) => {
          b.setContext(this.context).draw();
        });   
      } 
      this.currentNotes = [];
      if(nextStave) {
        this.currentStave = nextStave;
      }
    }
    if (this.currentNotes.length > 0) {
      this.renderPreviousStaves(); 
      const beams = Vex.Flow.Beam.generateBeams(this.currentNotes);
      Vex.Flow.Formatter.FormatAndDraw(this.context, this.currentStave, this.currentNotes);
      beams.forEach((b) => {
        b.setContext(this.context).draw();
      });
    }
  }

  private renderPreviousStaves(): void {
    if(this.notes.length > 0) {
      for (let e = 0; e < this.notes.length; e++) {
      var a = this.notes[e];
      const beams = Vex.Flow.Beam.generateBeams(a);
      Vex.Flow.Formatter.FormatAndDraw(this.context, this.staves[e], a);
      beams.forEach((b) => {
        b.setContext(this.context).draw();
      });
    }
  }
  }
}