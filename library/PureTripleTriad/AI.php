<?php
class PureTripleTriad_AI {

    protected $game;
    public $smartness;  //basically win/loss percentage *10:    0 = dumb, 10 = smart.
    
    function __construct($smartness) {
        $this->smartness = $smartness;
    }
    
    public function compute($game) {
        
        $this->game = $game;
        
        //build hand - keep in mind that these are references to cards in play! don't change values, only evaluate them
        $hand = array();
        foreach($game->gamecards as $card) {
            if ($card->position == -2) {
                array_push($hand, $card);
            }
        }
        
        //this array holds information about the best card to play for each open position
        $bestscores = array();
        
        for($i = 0; $i < 9; $i++) {
            //if playable, the playboard for this position is null
            if (!$game->playboard[$i]) {
                
                //this array will hold each playable cards scores for this position
                $allscores = array();
                
                //consider each card in hand for the position
                foreach($hand as $card) {
                    $scores = array(
                        'attack'        => 0, //an attack score against the adjacent cards
                        'defense'       => 0, //a defense score if the adjacent areas are open
                        'waste'         => 0, //if the adjacent areas are a wall or cards owned by CPU, this score determines the "wasted" effect of those values
                        'flips'         => 0, //if the actions results in a flip
                        'name'          => $card->name,
                        'gamecardid'    => $card->gamecardid,
                        'position'      => $i
                    );
                    
                    //evaluate basic rule
                    $scores = $this->basic($scores, $card, $i);
                    
                    //evalate plus rule
                    if ($this->game->rules['plus']) {
                        $scores = $this->plus($scores, $card, $i);
                    }
                    
                    //evaluate same and same wall
                    if ($this->game->rules['same']) {
                        $scores = $this->same($scores, $card, $i);
                    }
                    
                    //add the results to the score array for this position
                    array_push($allscores, $scores);
                }
                //after considering all available cards, determine the best for this position and then add to best overall scores array
                array_push($bestscores, $this->bestPlay($allscores));
            }
        };
        //debugging!
        //print_r($bestscores);
        
        //with all the best play's collected from each position, use the same logic to determine best play overall
        return $this->bestPlay($bestscores);
    }
    
    private function bestPlay($allscores) {
        
        $bestscores = array();        //we continue to push on the best play scores. at the end the best play will be at the top (or end)
        
        //loop through all scores considered for this position
        foreach($allscores as $scores) {
            
            //consider not set first!
            if (empty($bestscores)) {
                array_push($bestscores, $scores);
            } else {
                //consider defense first
                
                if ($scores['defense'] > $bestscores[count($bestscores)-1]['defense']) {
                    array_push($bestscores, $scores);
                }
            }
            
            //consider aggressive plays - score must be even or down
            if ($this->game->p1score >= $this->game->p2score) {
                
                $captures = false;
                //before we consider this agressive play, check to see if there are any definite captures
                foreach($allscores as $others) {
                    if ($others['flips'] > 0) {
                        $captures = true;
                        break;
                    }
                }
                //if no flips found, even through we're losing or tied, play defensively!
                //if flips found, clear best card and find new one
                if ($captures) {
                    foreach($allscores as $others) {
                        //if more flips than current best or better attack rating with same flips
                        if (
                            $others['flips'] > $bestscores[count($bestscores)-1]['flips'] || 
                            (($others['flips'] == $bestscores[count($bestscores)-1]['flips']) && $others['defense'] > $bestscores[count($bestscores)-1]['defense'])) {
                            array_push($bestscores, $others);
                        }
                    }
                }
            }
            
            //consider power plays last since they have the highest importance (and will override the above)
            //a power play is simply a play at involves more than one flip
            $power = false;
            foreach($allscores as $others) {
                if ($others['flips'] > 1) {
                    $power = true;
                    break;
                }
            }
            if ($power) {
                foreach($allscores as $others) {
                    //if more flips than current best or better defense rating with same flips
                    if (
                        $others['flips'] > $bestscores[count($bestscores)-1]['flips'] || 
                        (($others['flips'] == $bestscores[count($bestscores)-1]['flips']) && $others['defense'] > $bestscores[count($bestscores)-1]['defense'])) {  
                        array_push($bestscores, $others);
                    }
                }
            }
        }
        
        //smartness chance! sometimes the CPU won't pick the smartest decision
        if (rand(0, $this->smartness+1) == 1) {
            //if chance succeeded, CPU makes random decision
            return $bestscores[array_rand($bestscores)];
        }
        
        return array_pop($bestscores);
    }
    
    private function basic($scores, $card, $position) {
        
        //if this is an element game
        $originalbonus = $card->elementbonus;
        if ($this->game->rules['elemental']) {
            //if an element exists at this position, adjust for bonus (this change is backed up and undone later)
            if ($this->game->elements[$position] > -1) {
                $card->elementbonus = (($card->element == $this->game->elements[$position]) ? $this->game->elementbonus : $this->game->elementbonus * -1);
            }
        }
        
        $nindex     = (($position - 3) < 0) ? -1 : $position - 3;
        $eindex     = $position + 1;
        $sindex     = (($position + 3) > 8) ? -1 : $position + 3;
        $windex     = $position - 1;
        //if against walls
        if ($eindex == 3 || $eindex == 6 || $eindex == 9) {
            $eindex = -1;
        }
        if ($windex == 2 || $windex == 5) {
            $windex = -1;
        }
        
        $nscores = $this->basicScores($card, $nindex, 'n', 's');
        $escores = $this->basicScores($card, $eindex, 'e', 'w');
        $sscores = $this->basicScores($card, $sindex, 's', 'n');
        $wscores = $this->basicScores($card, $windex, 'w', 'e');
        
        //sum results
        $scores['attack']       = $nscores['attack'] + $escores['attack'] + $sscores['attack'] + $wscores['attack'];
        $scores['defense']      = $nscores['defense'] + $escores['defense'] + $sscores['defense'] + $wscores['defense'];
        $scores['waste']        = $nscores['waste'] + $escores['waste'] + $sscores['waste'] + $wscores['waste'];
        $scores['flips']        = $nscores['flips'] + $escores['flips'] + $sscores['flips'] + $wscores['flips'];
        
        //reset after evaluation
        $card->elementbonus = $originalbonus;
        
        return $scores;
    }
    
    private function basicScores($card, $evaluateindex, $myrankindex, $theirrankindex) {
        
        $scores = array(
            'attack'        => 0, //an attack score against the adjacent cards
            'defense'       => 0, //a defense score if the adjacent areas are open. if not (like walls), card is completely defended
            'waste'         => 0, //if the adjacent areas are a wall or cards owned by CPU, this score determines the "wasted" effect of those values
            'flips'         => 0 //if the actions results in a flip
        );
        
        //if position evaluating wasn't against a wall 
        if ($evaluateindex != -1) {
            
            //if the position is empty
            if (!$this->game->playboard[$evaluateindex]) {
                $scores['defense'] = $card->getRank($myrankindex) * 2; //in this case, *2 def! highest vulnerability
            } else {
                //a card exists in the evaluation index
                
                $othercard = $this->game->playboard[$evaluateindex];
                
                //has this card already been captured by me? if so, its basically another wall
                if ($othercard->captured == 1)
                {
                    $scores['waste']    = $card->getRank($myrankindex) * 2;
                    $scores['defense']  = 20;
                } else {
                    //card does not belong to you, consider this for attack
                    
                    $myrank     = $card->getRank($myrankindex);
                    $theirrank  = $othercard->getRank($theirrankindex);
                    
                    //consider elemental properties (theircard already has a set bonus being on the playboard)
                    if ($this->game->rules['elemental']) {
                        $myrank     += $card->elementbonus;
                        $theirrank  += $othercard->elementbonus;
                    }
                    
                    //if your card beats theirs, record a flip
                    if ($myrank > $theirrank) {
                        
                        //we don't wanna waste a rank 10 card flipping a 1, so vary attack score
                        $scores['attack']   = (10 - ($card->getRank($myrankindex) - $othercard->getRank($theirrankindex)));
                        $scores['flips']    = $scores['flips'] + 1;
                        $scores['defense']  = 20; //after flipping the card, this direction becomes a wall
                    } else {
                        //we can't beat them, this acts as an other wall really
                        $scores['waste']    = $card->getRank($myrankindex) * 2;
                        $scores['defense']  = 20;
                    }
                }
            }
        } else {
            //evaluating against a wall
            $scores['waste']    = $card->getRank($myrankindex) * 2;
            $scores['defense']  = 20;
        }
        return $scores;
    }
    
    private function plus($scores, $card, $position) {
        
        //so we're basically looking for adjacent cards which share the same sum as two or more of my card. 
        //this rule can flip up to 4 cards that share the same sum or simply two different sums
        //cards that I've already captured are figured into the equation
        //remember that elemental bonuses are not calculated into the plus rule
        
        $nindex     = (($position - 3) < 0) ? -1 : $position - 3;
        $eindex     = $position + 1;
        $sindex     = (($position + 3) > 8) ? -1 : $position + 3;
        $windex     = $position - 1;
        //if against walls
        if ($eindex == 3 || $eindex == 6 || $eindex == 9) {
            $eindex = -1;
        }
        if ($windex == 2 || $windex == 5) {
            $windex = -1;
        }
        
        $sums = array();
        
        //calculate sums
        
        array_push($sums, $this->plusScores($card, $nindex, 'n', 's'));
        array_push($sums, $this->plusScores($card, $eindex, 'e', 'w'));
        array_push($sums, $this->plusScores($card, $sindex, 's', 'n'));
        array_push($sums, $this->plusScores($card, $windex, 'w', 'e'));
        
        //now check list of sum values for qualifying sums
        
        //outer loop, run over each saved sum
        for($i = 0; $i < count($sums); $i++) {
            //inner loop, compare it to the other saved sums looking for matches
            for($j = $i + 1; $j < count($sums); $j++) {
                if ($sums[$i]['sum'] == $sums[$j]['sum'] && $sums[$j]['sum'] > 0) {
                    $sums[$i]['qualify'] = true;
                    $sums[$j]['qualify'] = true;
                }
            }
        }
        
        foreach($sums as $sum) {
            //only add to attack score if one of the qualifying cards is not already mine
            if ($sum['qualify'] && $sum['capturable']) {
                $scores['attack'] += 10;
                $scores['flips'] += 1;
            }
        }
        return $scores;
    }
    
    private function plusScores($card, $evaluateindex, $myrankindex, $theirrankindex) {
        
        //return array contains sum and whether the card is capturable
        $return = array(
            'sum'           => 0,
            'capturable'    => false,
            'qualify'       => false
        ); 
        
        if ($evaluateindex != -1 && $this->game->playboard[$evaluateindex]) {
            //if the same rule is also on, same values do not count as pluses
            if (($card->getRank($myrankindex) == $this->game->playboard[$evaluateindex]->getRank($theirrankindex)) && $this->game->rules['same']) {
                return $return;
            }
            $capturable = false;
            if ($this->game->playboard[$evaluateindex]->captured != 1) {
                $capturable = true;
            }
            return array(
                'sum'           => (intval($card->getRank($myrankindex)) +  intval($this->game->playboard[$evaluateindex]->getRank($theirrankindex))),
                'capturable'    => $capturable,
                'qualify'       => false
            );
        }
        return $return;
    }
    
    private function same($scores, $card, $position) {
        
        //like plus, we're only considered with attack and flip properties of same
        
        $nindex     = (($position - 3) < 0) ? -1 : $position - 3;
        $eindex     = $position + 1;
        $sindex     = (($position + 3) > 8) ? -1 : $position + 3;
        $windex     = $position - 1;
        //if against walls
        if ($eindex == 3 || $eindex == 6 || $eindex == 9) {
            $eindex = -1;
        }
        if ($windex == 2 || $windex == 5) {
            $windex = -1;
        }
        
        $sames = array();
        
        //calculate sames
        
        array_push($sames, $this->sameScores($card, $nindex, 'n', 's'));
        array_push($sames, $this->sameScores($card, $eindex, 'e', 'w'));
        array_push($sames, $this->sameScores($card, $sindex, 's', 'n'));
        array_push($sames, $this->sameScores($card, $windex, 'w', 'e'));
        
        //count totals
        $samecount = 0;
        foreach($sames as $same) {
            if ($same['same']) {
                $samecount++;
            }
        }
        //if more than one, then the same rule can apply here, but first see if there are any captures! 
        if ($samecount > 1) {
            foreach($sames as $same) {
                //captruable is ONLY true when a same rule applies to a position and the card is capturable
                if ($same['capturable']) {
                    $scores['attack'] += 10;
                    $scores['flips'] += 1;
                }
            }
        }
        return $scores;
    }
    
    private function sameScores($card, $evaluateindex, $myrankindex, $theirrankindex) {
        
        $return = array (
            'same'          => false,
            'capturable'    => false
        );
        
        //if not a wall and there is a card to evaluate
        if ($evaluateindex != -1) {
            if ($this->game->playboard[$evaluateindex]) {
                if ($card->getRank($myrankindex) == $this->game->playboard[$evaluateindex]->getRank($theirrankindex)) {
                    $capturable = false;
                    if ($this->game->playboard[$evaluateindex]->captured != 1) {
                        $capturable = true;
                    }
                    return array (
                        'same'          => true,
                        'capturable'    => $capturable
                    );
                }
                return $return;
            }
            return $return;
        } else {
            //same wall
            if ($card->getRank($myrankindex) == 10) {
                return array (
                    'same'          => true,
                    'capturable'    => false
                );
            }
            return $return;
        }
        return $return;
    }

}
?>
