import { useEffect, useRef, useState } from "react";
import "./index.css";

interface IEvent {
  id: string;
  time: number;
  type: string;
}

interface ITickerMessage {
  id: string;
  body: string;
}

interface IGoalEvent extends IEvent {
  player: string;
  distanceOfShot: number;
  newScore: {
    home: number;
    away: number;
  };
}
enum EventType {
  GOAL = "goal",
  CARD = "card",
}

interface ICardEvent extends IEvent {
  cardType: string;
  player: string;
}

type EmbedProps = {
  event: IEvent;
};

function Embed(props: EmbedProps) {
  if (props.event.type === EventType.CARD) {
    return <CardEventComponent event={props.event as ICardEvent} />;
  } else if (props.event.type === EventType.GOAL) {
    return <GoalEventComponent event={props.event as IGoalEvent} />;
  }

  return null;
}

function Ticker(props: { messages: ITickerMessage[] }) {
  const tickerRef = useRef<HTMLDivElement>();
  const [message, setMessage] = useState<ITickerMessage>(props.messages[0]);
  useEffect(() => {
    let index = 0;
    tickerRef.current.addEventListener("animationstart", function(){
      index++;
    });
    tickerRef.current.addEventListener("animationend", function () {
      console.log("animation end",index);
      if (index < props.messages.length) {
        index++;
        setMessage(props.messages[index]);
        console.log("Sven 1",props.messages[index]);
      } else {
        setMessage(props.messages[index]);
        console.log("Sven 2",props.messages[index]);
      }
    });
  }, [props.messages, tickerRef]);

  return (
    <div
      ref={tickerRef}
      style={{
        background: "green",
        width: "auto",
        height: 50,
        position: "relative",
        justifySelf: "end",
      }}
      className="horizontal_move"
    >
      {message?.body}
    </div>
  );
}

function GoalEventComponent(props: { event: IGoalEvent }) {
  return (
    <div
      style={{
        position: "relative",
        justifyContent: "center",
        width: 200,
        height: 75,
        background: "purple",
      }}
      className="jump"
    >
      {props.event.player} scored!
    </div>
  );
}

function CardEventComponent(props: { event: ICardEvent }) {
  return (
    <div
      style={{
        position: "relative",
        justifyContent: "center",
        width: 200,
        height: 75,
        color: "black",
        background: props.event.cardType,
      }}
      className="jump"
    >
      {props.event.player} got a {props.event.cardType} card!
    </div>
  );
}

function EmbedOverlay(props: {
  tickerMessages: ITickerMessage[];
  events: IEvent[];
  current_time: number;
  videoRef: HTMLVideoElement;
  isFullscreen: boolean;
}) {
  const embedRef = useRef<HTMLDivElement>();

  return (
    <div
      className="embedOverlay"
      style={{
        position: "absolute",
        left: props.videoRef.clientLeft,
        top: props.videoRef.clientTop,
        width: props.videoRef.clientWidth,
        height: props.videoRef.clientHeight,
        pointerEvents: "none",
        backgroundColor: "transparant",
        display: "flex",
      }}
      ref={embedRef}
    >
      {props.events
        .filter(
          (event) =>
            props.current_time >= event.time &&
            props.current_time <= event.time + 5
        )
        .map((event) => {
          return <Embed event={event} />;
        })}
      <Ticker messages={props.tickerMessages} />
    </div>
  );
}
function isFullScreen(): boolean {
  return (
    document.fullscreenElement ||
    // @ts-ignore webkit...
    document.webkitFullscreenElement ||
    // @ts-ignore firefox...
    document.mozFullScreenElement ||
    // @ts-ignore edge...
    document.msFullscreenElement
  );
}
export default function App(): JSX.Element {
  const [events, setEvents] = useState<IEvent[]>([]);
  const [tickers, setTickers] = useState<ITickerMessage[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const SECONDS = 1000;
  useEffect(() => {
    fetch(
      "https://tradecast-development-test.s3.eu-west-1.amazonaws.com/frontend-test.json"
    )
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.events);
        setTickers(data.ticker);
      })
      .catch(console.error);
    videoRef.current.muted = true;
    videoRef.current.play();

    setInterval(
      () => setCurrentTime(videoRef.current?.currentTime),
      1 * SECONDS
    );
  }, []);
  const x = events.filter(
    (event) => currentTime >= event.time && currentTime <= event.time + 5
  );
  return (
    <div className="App">
      <video controls ref={videoRef} width={980} height={540}>
        <source src="/video.mp4" />
        test
      </video>
      {videoRef.current && (
        <EmbedOverlay
          tickerMessages={tickers}
          current_time={currentTime}
          events={events}
          videoRef={videoRef.current}
          isFullscreen={isFullScreen()}
        />
      )}
      <div>{<pre>{JSON.stringify(x)}</pre>}</div>
    </div>
  );
}
