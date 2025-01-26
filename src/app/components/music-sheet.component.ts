import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Renderer, Stave, StaveNote, TabNote,  RenderContext, Vex} from 'vexflow';

@Component({
  selector: 'app-music-sheet',
  standalone: true,
  templateUrl: './templates/music-sheet.component.html',
  styleUrls: ['./styles/music-sheet.component.css']
})
export class MusicSheetComponent implements OnInit, AfterViewInit {

  private currentContainerIndex: number = 0;

  private raws: { stave: Stave; renderer: Renderer; context: RenderContext; notes: StaveNote[] }[] = [];

  private currentStave!:Stave;
  private currentRenderer!: Renderer;
  private context!: RenderContext;
  private currentNotes: StaveNote[] = [];

  private svgContainer: HTMLDivElement | null = null;

  selectedNote: string = "c/4";
  selectedDuration: string = "1";

  private containerBoundingRect?: DOMRect;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initializeStave();
  }

  private initializeSvgContainer():  HTMLDivElement {
    const svgContainerId = `music-sheet-${this.currentContainerIndex}`;
    const svgContainer = document.createElement('div');
    svgContainer.id = svgContainerId;
    svgContainer.className = 'svg-container';
    const mainElement = document.querySelector('#music-sheet');
    if(mainElement) {
      mainElement.appendChild(svgContainer);
    }
    this.currentContainerIndex++;
    return svgContainer;
  }

  private getContextForSvgContainer(svgContainer: HTMLDivElement): RenderContext {
      this.currentRenderer = new Renderer(svgContainer, Renderer.Backends.SVG);
      return this.currentRenderer.getContext();
  }

  private initializeStave(): void {
    this.svgContainer = this.initializeSvgContainer(); // div
    this.context = this.getContextForSvgContainer(this.svgContainer);

    this.updateStaveContainerSize();

    if(this.containerBoundingRect) {
      this.currentStave = new Stave(0, 0, this.containerBoundingRect.width/100*90);
      this.currentStave.addTimeSignature("4/4");
      this.currentStave.addClef('treble').setContext(this.context).draw();
    }

    // window.addEventListener('resize', () => {
    //   this.updateStaveContainerSize();
    // });
  }

  private updateStaveContainerSize(): void {
      if (!this.svgContainer) return;
      this.containerBoundingRect = this.svgContainer.getBoundingClientRect();
      console.log("boundingRect " + JSON.stringify(this.containerBoundingRect))
      this.currentRenderer.resize(this.containerBoundingRect.width, this.containerBoundingRect.height);

      // if (this.currentStave) {
      //     this.currentStave.setWidth(this.containerBoundingRect.width);
      //     this.context.clear();
      //     this.currentStave.setContext(this.context).draw();
      //
      //
      //     this.staves.forEach(stave=>stave.setContext(this.context).draw());
      //     this.renderNotesPreviousStaves()
      // }
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
      this.currentStave.setContext(this.context).draw();

      // calculate the duration of stave
      let durations: number[] = this.currentNotes.map((a)=> Number(a.getDuration()));
      console.log(durations);
      let staveDuration = durations.reduce( (a,b)=> a + 1/b, 0 );
      console.log(staveDuration)


      // if stave completed:
      if (staveDuration == 1) {
        let nextStave = null;
        if(this.svgContainer) {

          this.currentStave.setContext(this.context).draw()
          const beams = Vex.Flow.Beam.generateBeams(this.currentNotes);
          Vex.Flow.Formatter.FormatAndDraw(this.context, this.currentStave, this.currentNotes);
          // draw the beams for notes of current stave
          beams.forEach((beam) => {
            beam.setContext(this.context).draw();
          });

          // create raw
          // stave: Stave; renderer: Renderer; context: RenderContext; notes: StaveNote[]
          let raw = {
            stave: this.currentStave,
            renderer: this.currentRenderer,
            context: this.context,
            notes: this.currentNotes
          }
          this.raws.push(raw)

          this.svgContainer = this.initializeSvgContainer();
          this.context = this.getContextForSvgContainer(this.svgContainer);

          nextStave = new Stave(0, 0, this.svgContainer.offsetWidth);

          nextStave.addTimeSignature("4/4");
          nextStave.addClef('treble').setContext(this.context).draw();
          this.updateStaveContainerSize();



          // nextStave.
          // this.staves.push(nextStave);


          // this.renderNotesPreviousStaves();
        }
        this.currentNotes = [];
        if(nextStave) {
          this.currentStave = nextStave;
        }
        // this.adjustGeneralContainerHeight()
      }
      if (this.currentNotes.length > 0) {
        const beams = Vex.Flow.Beam.generateBeams(this.currentNotes);
        Vex.Flow.Formatter.FormatAndDraw(this.context, this.currentStave, this.currentNotes);
        beams.forEach((beam) => {
          beam.setContext(this.context).draw();
        });
      }
  }

  private adjustGeneralContainerHeight(): void {
    // if (!this.svgContainer) return;
    // console.log('****[ ' + this.initialYStaveCoordinate);
    // this.svgContainer.style.height = `${this.initialYStaveCoordinate}px`;
    // console.log('height' + this.svgContainer.style.height)
    // this.currentRenderer.resize(580, parseInt(this.svgContainer.style.height));
  }

  private renderNotesPreviousStaves(): void {
    //   if(this.notes.length > 0) {
    //     for (let counter = 0; counter < this.notes.length; counter++) {
    //     var staveNotes = this.notes[counter];
    //     const beams = Vex.Flow.Beam.generateBeams(staveNotes);
    //     Vex.Flow.Formatter.FormatAndDraw(this.context, this.staves[counter], staveNotes);
    //     beams.forEach((beam) => {
    //       beam.setContext(this.context).draw();
    //     });
    //   }
    // }
  }
}
